import Grid from "@mui/material/Grid";
import React, { useEffect, useState } from "react";

import DeviceCard from "../../components/DeviceCard";
import { Device } from "../../types/types";
import { getDevices, DEVICE_API_WS } from "../../utils/api";
import { deserializeMessage } from "../../utils/utils";

// Global State
// TODO: use this
export const DevicesContext = React.createContext(null);

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

const CamerasPage: React.FC = () => {
    const [exploreHD_cards, setExploreHD_cards] = useState<JSX.Element[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);

    const addDevices = (devices: Device[]) => {
        setExploreHD_cards((prevCards) => {
            return [
                ...prevCards,
                ...devices.map((device) => (
                    <DeviceCard key={hash(device.bus_info)} device={device} />
                )),
            ];
        });
        setDevices((prevDevices) => {
            return [...prevDevices, ...devices];
        });
    };

    const addDevice = (device: Device) => {
        setExploreHD_cards((prevCards) => {
            return [
                ...prevCards,
                <DeviceCard key={hash(device.bus_info)} device={device} />,
            ];
        });
        setDevices((prevDevices) => {
            return [...prevDevices, device];
        });
    };

    const removeDevice = (bus_info: string): void => {
        setExploreHD_cards((prevCards) => {
            return prevCards.filter((card) => {
                return card.props.device.bus_info != bus_info;
            });
        });
    };

    useEffect(() => {
        for (let i in devices) {
            let device = devices[i];
            exploreHD_cards[i] = (
                <DeviceCard key={hash(device.bus_info)} device={device} />
            );
        }
    }, [devices]);

    useEffect(() => {
        // Code to run once when the component is defined
        getDevices().then((devices) => {
            console.log("Devices: ", devices);
            addDevices(devices);
        });

        websocket.addEventListener("message", (e) => {
            let message = deserializeMessage(e.data);
            console.log(message.data);
            switch (message.event_name) {
                case "device_added":
                    addDevice(message.data as Device);
                    break;
                case "device_removed":
                    removeDevice((message.data as DeviceRemovedInfo).bus_info);
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
            <DevicesContext.Provider value={{ devices, setDevices }}>
                {exploreHD_cards.sort((a, b) => {
                    const regex = /(\/dev\/video)(\d+)/;
                    let pathA = a.props.device.cameras[0].path;
                    let pathB = b.props.device.cameras[0].path;
                    return (
                        Number(regex.exec(pathA)![2]) -
                        Number(regex.exec(pathB)![2])
                    );
                })}
            </DevicesContext.Provider>
        </Grid>
    );
};

export default CamerasPage;
