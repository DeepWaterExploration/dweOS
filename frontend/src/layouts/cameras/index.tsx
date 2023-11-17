import Grid from "@mui/material/Grid";
import React, { useEffect, useState } from "react";

import DeviceCard from "./DeviceCard";
import { Device } from "../../types/types";
import { getDevices, DEVICE_API_WS } from "../../utils/api";

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

  const removeDevice = (device: Device): void => {
    setExploreHD_cards((prevCards) => {
      return prevCards.filter((card) => {
        return card.props.device.bus_info != device.bus_info;
      });
    });
  };

  const removeDevices = (devices: Device[]) => {
    for (const device of devices) {
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
    const socket = new WebSocket(DEVICE_API_WS);

    // Listen for messages
    socket.addEventListener("message", (event) => {
      const lines = event.data.split("\n");
      const event_name = lines[0];
      const msg = JSON.parse(lines[1]);
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
      {exploreHD_cards}
    </Grid>
  );
};

export default CamerasPage;
