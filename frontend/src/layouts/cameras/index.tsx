import Grid from "@mui/material/Grid";
import React, { useEffect, useState } from "react";

import DeviceCard from "./DeviceCard";
import { Device } from "../../types/types";
import { getDevices, DEVICE_API_WS, DEVICE_API_URL } from "../../utils/api";

import { io } from "socket.io-client";

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

interface Message {
    event_name: string;
    data: object;
}

interface DeviceRemovedInfo {
    bus_info: string;
}

const deserializeMessage = (message_str: string) => {
    let parts = message_str.split(": ");
    let message: Message = {
        event_name: parts[0],
        data: JSON.parse(message_str.substring(message_str.indexOf(": ") + 1)),
    };
    return message;
};

const websocket = new WebSocket(DEVICE_API_WS);

const CamerasPage: React.FC = () => {
    const [exploreHD_cards, setExploreHD_cards] = useState<JSX.Element[]>([]);

    const addDevices = (devices: Device[]) => {
        setExploreHD_cards((prevCards) => {
            return [
                ...prevCards,
                ...devices.map((device) => (
                    <DeviceCard key={hash(device.bus_info)} device={device} />
                )),
            ];
        });
    };

    const addDevice = (device: Device) => {
        setExploreHD_cards((prevCards) => {
            return [
                ...prevCards,
                <DeviceCard key={hash(device.bus_info)} device={device} />,
            ];
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
            {/* Sort devices */}
            {/* Sorting does not work with new backend changes */}
            {/* {exploreHD_cards.sort((a, b) => {
        const usbInfoA = a.props.device.bus_info.split(".");
        const usbInfoB = b.props.device.bus_info.split(".");
        for (let i = 0; i < usbInfoA.length; i++) {
          if (i > usbInfoB.length - 1) return 1;
          if (parseInt(usbInfoA[i]) > parseInt(usbInfoB[i])) {
            return 1;
          } else if (parseInt(usbInfoA[i]) < parseInt(usbInfoB[i])) {
            return -1;
          } else {
            continue;
          }
        }
        return 1;
      })} */}
            {exploreHD_cards.sort((a, b) => {
                const regex = /(\/dev\/video)(\d+)/;
                let pathA = a.props.device.cameras[0].path;
                let pathB = b.props.device.cameras[0].path;
                return (
                    Number(regex.exec(pathA)![2]) -
                    Number(regex.exec(pathB)![2])
                );
            })}
        </Grid>
    );
};

export default CamerasPage;
