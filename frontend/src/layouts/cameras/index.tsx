import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import React, { useContext, useEffect, useState } from "react";

import DeviceCard from "./components/DeviceCard";
import {
    deserializeMessage,
    findDeviceWithBusInfo,
    hash,
} from "../../utils/utils";

import DevicesContext from "../../contexts/DevicesContext";
import DeviceContext from "../../contexts/DeviceContext";
import { proxy, subscribe } from "valtio";
import { useSnackbar } from "notistack";
import { Device } from "./types";
import { SavedPreferences } from "../preferences/types";
import { getRecommendedHost, getSettings } from "../preferences/api";
import { getDevices } from "./api";
import { styles } from "../../style";
import WebsocketContext from "../../contexts/WebsocketContext";

interface DeviceRemovedInfo {
    bus_info: string;
}

interface GstErrorMessage {
    errors: string[];
    bus_info: string;
}

const DevicesLayout = () => {
    const { enqueueSnackbar } = useSnackbar();

    const { devices, setDevices } = useContext(DevicesContext) as {
        devices: Device[];
        setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
    };

    const { websocket, connected } = useContext(WebsocketContext) as {
        websocket: WebSocket;
        connected: boolean;
    };

    const [hasRequestedDevices, setHasRequestedDevices] = useState(false);

    const [savedPreferences, setSavedPreferences] = useState({
        default_stream: { port: 5600, host: "192.168.2.1" },
    } as SavedPreferences);

    const [nextPort, setNextPort] = useState(5600);

    const addDevices = (devices: Device[]) => {
        setDevices((prevDevices: Device[]) => {
            return [...prevDevices, ...devices];
        });
    };

    const addDevice = (device: Device) => {
        if (devices.find((dev) => dev.bus_info === device.bus_info)) {
            updateDevice(device);
        } else {
            setDevices((prevDevices: Device[]) => {
                return [...prevDevices, device];
            });
        }
    };

    const removeDevice = (bus_info: string): void => {
        setDevices((prevDevices: Device[]) => {
            for (let device of prevDevices) {
                if (device.bus_info == bus_info && device.follower) {
                    removeLeaderUpdate(device.follower, prevDevices);
                }
            }
            return prevDevices.filter((device) => {
                return device.bus_info != bus_info;
            });
        });
    };

    const updateDevice = (device: Device) => {
        setDevices((prevDevices) => {
            let newDevices = [...prevDevices];
            newDevices = newDevices.filter(
                (dev) => dev.bus_info != device.bus_info
            );
            newDevices.push(device);
            return newDevices;
        });
    };

    const getInitialDevices = async () => {
        let devices = await getDevices();
        let preferences = await getSettings();
        if (preferences.suggest_host) {
            preferences.default_stream.host = await getRecommendedHost(); // recommend host based on IP
        }
        let nextPort = getNextPort(devices, preferences);
        // Initialize the next port
        setNextPort(nextPort);

        setSavedPreferences(preferences);
        setDevices(devices);

        setHasRequestedDevices(true);
    };

    const socketCallback = (e) => {
        let message = deserializeMessage(e.data);
        switch (message.event_name) {
            case "device_added": {
                let dev = message.data as Device;
                enqueueSnackbar(
                    `Device added: ${dev.bus_info} - ${dev.nickname || dev.device_type}`,
                    {
                        variant: "info",
                    }
                );
                addDevice(message.data as Device);
                break;
            }
            case "device_removed": {
                let dev = message.data as DeviceRemovedInfo;
                enqueueSnackbar(`Device removed: ${dev.bus_info}`, {
                    variant: "info",
                });
                removeDevice((message.data as DeviceRemovedInfo).bus_info);
                break;
            }
            case "gst_error":
                let gstErrorMessage = message.data as GstErrorMessage;
                stopStreamUpdate(gstErrorMessage.bus_info);
                enqueueSnackbar(
                    <span>
                        GStreamer Error Occurred: {gstErrorMessage.bus_info} -
                        This is likely a known issue with the kernel, please
                        click for more details.
                    </span>,
                    {
                        variant: "error",
                        autoHideDuration: 5000,
                        action: () => (
                            <a
                                href='https://dwe.ai/kernel-issue'
                                target='_blank'
                                style={{
                                    color: "white",
                                    textDecoration: "none",
                                    padding: "8px 16px",
                                    display: "block",
                                    width: "100%",
                                }}
                            >
                                Learn More
                            </a>
                        ),
                    }
                );
                break;
        }
    };

    useEffect(() => {
        if (!connected) {
            setDevices([]);
            setHasRequestedDevices(true);
        } else {
            // Code to run once when the component is defined and websocket connects
            getInitialDevices();

            websocket.addEventListener("message", socketCallback);
            return () => {
                websocket.removeEventListener("message", socketCallback);
            };
        }
    }, [connected]);

    // The following are util functions as a way for any device to set properties of other devices and rerendering them

    const enableStreamUpdate = (bus_info: string) => {
        setDevices((prevDevices) => {
            let newDevices = [...prevDevices];
            let index = findDeviceWithBusInfo(newDevices, bus_info);
            if (index === -1) return newDevices;
            let device = newDevices[index];
            device.stream.configured = true;
            return newDevices;
        });
    };

    const stopStreamUpdate = (bus_info: string) => {
        setDevices((prevDevices) => {
            let newDevices = [...prevDevices];
            let index = findDeviceWithBusInfo(newDevices, bus_info);
            if (index === -1) return newDevices;
            let device = newDevices[index];
            device.stream.configured = false;
            return newDevices;
        });
    };

    const removeLeaderUpdate = (
        bus_info: string,
        device_list: Device[] | undefined = undefined
    ) => {
        if (!device_list) device_list = devices;
        let follower =
            device_list[findDeviceWithBusInfo(device_list, bus_info)];
        if (follower) {
            follower.leader = undefined;
            updateDevice(follower);
        }
    };

    const setFollowerUpdate = (
        leader_bus_info: string,
        follower_bus_info: string | undefined
    ) => {
        let leader = devices[findDeviceWithBusInfo(devices, leader_bus_info)];
        leader.follower = follower_bus_info;
        updateDevice(leader);
    };

    const getNextPort = (devs = devices, prefs = savedPreferences) => {
        let allPorts: number[] = [];
        devs.forEach((device) => {
            device.stream.endpoints.forEach((endpoint) =>
                allPorts.push(endpoint.port)
            );
        });
        return allPorts.length > 0
            ? allPorts.sort().reverse()[0] + 1
            : prefs.default_stream.port; // return the highest port
    };

    return (
        <Grid
            container
            spacing={4}
            alignItems='baseline'
            flexWrap='wrap'
            style={{
                justifyContent: "space-evenly",
            }}
        >
            {devices.length === 0 && hasRequestedDevices && (
                <Grid
                    container
                    spacing={0}
                    direction='column'
                    alignItems='center'
                    justifyContent='center'
                    sx={{ height: "60vh" }}
                >
                    <Grid item xs={3}>
                        <Paper
                            elevation={1}
                            sx={{
                                padding: "50px",
                                textAlign: "center",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                borderRadius: "15px",
                                ...styles.card,
                            }}
                        >
                            <Typography variant='h4' component='div'>
                                No Cameras Detected
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            )}
            {devices
                .sort((a: Device, b: Device) => {
                    // Compare devies by type, final number in bus info, and hash of bus info
                    const regex = /\d+(?!.*\d)/;
                    let pathA = a.bus_info;
                    let pathB = b.bus_info;

                    if (a.device_type === b.device_type)
                        return (
                            Number(regex.exec(pathA)![0]) -
                                Number(regex.exec(pathB)![0]) ||
                            hash(pathA) - hash(pathB)
                        );
                    else return hash(a.device_type) - hash(b.device_type);
                })
                .map((dev) => {
                    const device = proxy(dev);

                    subscribe(device, () => {
                        // update devices without triggering rerender
                        const index = devices.findIndex(
                            (dev) => dev.bus_info === device.bus_info
                        );
                        if (index !== -1) {
                            devices.splice(index, 1, device); // Replace the existing device
                        }

                        // set the next port
                        let port = getNextPort();
                        setNextPort(port);
                    });

                    return (
                        <DeviceContext.Provider
                            value={{
                                device,
                                devices,
                                enableStreamUpdate,
                                removeLeaderUpdate,
                                setFollowerUpdate,
                                nextPort,
                                defaultHost:
                                    savedPreferences.default_stream.host,
                            }}
                            key={device.bus_info}
                        >
                            <DeviceCard key={device.bus_info} />
                        </DeviceContext.Provider>
                    );
                })}
        </Grid>
    );
};

const CamerasPage = () => {
    const [devices, setDevices] = useState([] as Device[]);

    return (
        <DevicesContext.Provider
            value={{
                devices,
                setDevices,
            }}
        >
            <DevicesLayout />
        </DevicesContext.Provider>
    );
};

export default CamerasPage;
