import Grid from "@mui/material/Grid";
import React, { useCallback, useEffect, useRef, useState } from "react";

import DeviceCard from "./DeviceCard";
import { getDevices } from "../../utils/api";
import { Device } from "src/types/types";

const hash = function (str: string) {
  var hash = 0,
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

const CamerasPage: React.FC = () => {
  const [exploreHD_cards, setExploreHD_cards] = useState<JSX.Element[]>([]);

  const addDevices = (devices: Device[]) => {
    setExploreHD_cards((prevCards) => {
      return [
        ...prevCards,
        ...devices.map((device) => (
          <DeviceCard key={hash(device.info.usbInfo)} device={device} />
        )),
      ];
    });
  };

  const removeDevice = (device: Device): void => {
    setExploreHD_cards((prevCards) => {
      return prevCards.filter((card) => {
        return card.props.device.info.usbInfo != device.info.usbInfo;
      });
    });
  };

  const removeDevices = (devices: Device[]) => {
    for (let device of devices) {
      removeDevice(device);
    }
  };

  useEffect(() => {
    // Code to run once when the component is defined
    getDevices().then((devices) => {
      console.log("Devices: ", devices);
      addDevices(devices);
    });

    // Create WebSocket connection.
    const socket = new WebSocket("ws://localhost:9002");

    // Listen for messages
    socket.addEventListener("message", (event) => {
      let lines = event.data.split("\n");
      let event_name = lines[0];
      let msg = JSON.parse(lines[1]);
      console.log("Event: ", event_name);
      console.log(msg);

      if (event_name === "added_devices") {
        addDevices(msg as Device[]);
      } else if (event_name === "removed_devices") {
        removeDevices(msg as Device[]);
      }
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
      {exploreHD_cards}
    </Grid>
  );
};

export default CamerasPage;
