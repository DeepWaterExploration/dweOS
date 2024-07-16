import Grid from "@mui/material/Grid";
import React, { useContext, useEffect, useState } from "react";

import DeviceCard from "../../components/DeviceCard";
import { Device, IntercomponentMessage } from "../../types/types";
import { getDevices, DEVICE_API_WS } from "../../utils/api";
import { deserializeMessage, findDeviceWithBusInfo } from "../../utils/utils";

import DevicesContext from "../../contexts/DevicesContext";

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
        setDevices((prevDevices: Device[]) => {
            return [...prevDevices, device];
        });
    };

    const removeDevice = (bus_info: string): void => {
        setDevices((prevDevices: Device[]) => {
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

        websocket.addEventListener("message", (e) => {
            let message = deserializeMessage(e.data);
            switch (message.event_name) {
                case "device_added":
                    addDevice(message.data as Device);
                    break;
                case "device_removed":
                    removeDevice((message.data as DeviceRemovedInfo).bus_info);
                    break;
                case "device_changed":
                    updateDevice(message.data as Device);
                    break;
            }
        });
    }, []);

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
                    const regex = /(\/dev\/video)(\d+)/;
                    let pathA = a.cameras[0].path;
                    let pathB = b.cameras[0].path;
                    return (
                        Number(regex.exec(pathA)![2]) -
                        Number(regex.exec(pathB)![2])
                    );
                })
                .map((device, index) => (
                    <DeviceCard
                        key={index}
                        device={device}
                    />
                ))}
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
