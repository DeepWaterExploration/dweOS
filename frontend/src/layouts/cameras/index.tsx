import Grid from "@mui/material/Grid";
import React, { useCallback, useEffect, useState } from "react";

import DeviceCard from "./DeviceCard";
import { Device, getDevices } from "../../utils/api";

const CamerasPage: React.FC = () => {
  const [exploreHD_cards, setExploreHD_cards] = useState<JSX.Element[]>([]);
  const [other_cards, setOther_cards] = useState<JSX.Element[]>([]);
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
    // get the devices from the backend
    getDevices().then(devices => {
      console.log("Devices: ", devices);
      addDevices(devices);
    });
  }, [addDevices]);

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
