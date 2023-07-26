import Grid from "@mui/material/Grid";
import React, { useCallback, useEffect, useRef, useState } from "react";

import DeviceCard from "./DeviceCard";
import { getDevices } from "../../utils/api";
import { Device } from "src/types/types";

declare global {
  interface Window {
    __webSocketClient: WebSocket;
  }
}

const CamerasPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    if (!(window.__webSocketClient instanceof WebSocket)) {
      window.__webSocketClient = new WebSocket("ws://localhost:9002");
      // Listen for messages
      window.__webSocketClient.addEventListener("message", (event) => {
        let lines = event.data.split("\n");
        let event_name = lines[0];
        let msg = JSON.parse(lines[1]);
        console.log("Event: ", event_name);
        console.log(msg);

        if (event_name === "removed_devices") {
          for (let device of msg as Device[]) {
            removeDevice(device.info.usbInfo);
          }
        } else if (event_name === "added_devices") {
          addDevices(msg as Device[]);
        }
      });
    }
  });

  const addDevices = (newDevices: Device[]) => {
    setDevices([...devices, ...newDevices]);
  };

  const removeDevice = (usbInfo: string): void => {
    // modifies state using the "previous state"
    // rather than directly modifying current state variable
    console.log(devices);
    setDevices(devices.filter((device) => device.info.usbInfo !== usbInfo));
  };

  useEffect(() => {
    // Code to run once when the component is defined
    getDevices().then((found_devices) => {
      setDevices(found_devices);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {devices.map((device, index) => {
        console.log(device);
        return <DeviceCard device={device} key={index}></DeviceCard>;
      })}
    </Grid>
  );
};

export default CamerasPage;
