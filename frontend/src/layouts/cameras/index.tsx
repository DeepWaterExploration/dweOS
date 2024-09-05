import Grid from "@mui/material/Grid";
import React, { useContext, useEffect, useState } from "react";

import DeviceCard from "../../components/DeviceCard";
import {
    Device,
    encodeType,
    IntercomponentMessage,
    StreamEndpoint,
    StreamFormat,
} from "../../types/types";
import { getDevices, DEVICE_API_WS, configureStream } from "../../utils/api";
import { deserializeMessage, findDeviceWithBusInfo } from "../../utils/utils";

import DevicesContext from "../../contexts/DevicesContext";
import DeviceContext from "../../contexts/DeviceContext";
import { proxy, subscribe } from "valtio";
import { useSnackbar } from "notistack";

const hash = function (str: string) {
    let hash = 0,
        i,
        chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0;
    }
    return hash;
};

interface DeviceRemovedInfo {
    bus_info: string;
}

export const websocket = new WebSocket(DEVICE_API_WS);

const DevicesContainer = () => {
    const { enqueueSnackbar } = useSnackbar();

    const { devices, setDevices } = useContext(DevicesContext) as {
        devices: Device[];
        setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
    };

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
                    console.log(device.follower);
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

    useEffect(() => {
        // Code to run once when the component is defined
        getDevices().then((devices) => {
            console.log("Devices: ", devices);
            addDevices(devices);
        });

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
                // case "device_changed":
                //     updateDevice(message.data as Device);
                //     break;
            }
        };

        websocket.addEventListener("message", socketCallback);
        return () => websocket.removeEventListener("message", socketCallback);
    }, []);

    // The following are util functions as a way for any device to set properties of other devices and rerendering them

    const enableStreamUpdate = (leader_bus_info: string) => {
        let leader = devices[findDeviceWithBusInfo(devices, leader_bus_info)];
        leader.stream.configured = true;
        updateDevice(leader);
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
            {devices
                .sort((a: Device, b: Device) => {
                    // Sort by the last number in bus info
                    // TODO: maybe sort by device type too
                    const regex = /\d+(?!.*\d)/;
                    let pathA = a.bus_info;
                    let pathB = b.bus_info;
                    return (
                        Number(regex.exec(pathA)![0]) -
                            Number(regex.exec(pathB)![0]) ||
                        hash(pathA) - hash(pathB)
                    );
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
                    });

                    return (
                        <DeviceContext.Provider
                            value={{
                                device,
                                devices,
                                enableStreamUpdate,
                                removeLeaderUpdate,
                                setFollowerUpdate,
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
            <DevicesContainer />
        </DevicesContext.Provider>
    );
};

export default CamerasPage;
