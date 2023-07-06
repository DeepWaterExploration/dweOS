import Grid from "@mui/material/Grid";
import React, { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";

import DeviceCard from "./DeviceCard";
import { Device } from "../../utils/api";

const CamerasPage: React.FC = () => {
  const [exploreHD_cards, setExploreHD_cards] = useState<JSX.Element[]>([]);
  const [other_cards, setOther_cards] = useState<JSX.Element[]>([]);
  const [socket] = useState(io());
  console.log("socket", socket);
  const addCard = useCallback(
    (device: Device): void => {
      if (device.caps.driver) {
        // takes the prevState, and using the `spread` operator
        // appends the new Card to the new array
        // to update the state
        setExploreHD_cards(prevCards => [
          ...prevCards,
          <DeviceCard key={exploreHD_cards.length} device={device} />,
        ]);
      } else {
        setOther_cards(prevCards => [
          ...prevCards,
          <DeviceCard key={other_cards.length} device={device} />,
        ]);
      }
    },
    [exploreHD_cards.length, other_cards.length]
  );

  const addDevices = useCallback(
    (devices: Device[]): void => {
      for (const device of devices) {
        addCard(device);
      }
    },
    [addCard]
  );

  const removeDevice = (device: Device): void => {
    const devicePath = device.devicePath;
    // modifies state using the "previous state"
    // rather than directly modifying current state variable

    if (device.caps.driver) {
      setExploreHD_cards(prevCards => {
        return prevCards.filter(card => {
          return card.props.device.devicePath != devicePath;
        });
      });
    } else {
      setOther_cards(prevState =>
        prevState.filter(card => {
          return card.props.device.devicePath != devicePath;
        })
      );
    }
  };

  useEffect(() => {
    // Add event listeners to handle device connection status updates
    socket.on("connect", () => {
      console.log("connect");
      fetch("/devices")
        .then(response => response.json())
        .then(devices => addDevices(devices));
    });
    socket.on("disconnect", () => {
      console.log("disconnect");
      fetch("/devices")
        .then(response => response.json())
        .then(devices => {
          for (const device of devices) {
            removeDevice(device);
          }
        });
    });
    socket.on("added", addedDevices => {
      console.log("added", addedDevices);
      for (const device of addedDevices) {
        addCard(device);
      }
    });
    socket.on("removed", removedDevices => {
      console.log("removed", removedDevices);
      for (const device of removedDevices) {
        removeDevice(device);
      }
    });
  }, [addCard, addDevices, socket]);

  return (
    <Grid
      container
      spacing={0}
      alignItems='baseline'
      style={{ justifyContent: "center", paddingBottom: "20px" }}
    >
      {exploreHD_cards}
      {other_cards}
    </Grid>
  );
};

export default CamerasPage;
