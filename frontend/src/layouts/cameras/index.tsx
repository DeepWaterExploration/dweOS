import Grid from "@mui/material/Grid";
import React, { useCallback, useEffect, useState } from "react";

import DeviceCard from "./DeviceCard";
import { Device, getDevices } from "../../utils/api";

const CamerasPage: React.FC = () => {
  const [exploreHD_cards, setExploreHD_cards] = useState<JSX.Element[]>([]);
  const addCard = useCallback(
    (device: Device): void => {
      let newKey: string;
      let isUnique: boolean;
      do {
        // Generate a random key
        newKey = Math.random().toString(36).substring(7);
        // Check if key is unique
        isUnique = !exploreHD_cards.some((card: React.ReactNode) => {
          const cardWithKey = card as React.ReactElement<{
            keyForClosing: string;
          }>;
          return cardWithKey.props.keyForClosing === newKey;
        });
      } while (!isUnique);
      // takes the prevState, and using the `spread` operator
      // appends the new Card to the new array
      // to update the state
      setExploreHD_cards((prevCards) => {
        return [
          ...prevCards,
          <DeviceCard key={exploreHD_cards.length} device={device} />,
        ];
      });
    },
    [exploreHD_cards.length]
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
    const devicePath = device.info.path;
    // modifies state using the "previous state"
    // rather than directly modifying current state variable
    setExploreHD_cards((prevCards) => {
      return prevCards.filter((card) => {
        return card.props.device.info.path != devicePath;
      });
    });
  };

  useEffect(() => {
    // Code to run once when the component is defined
    getDevices().then((devices) => {
      addDevices(devices);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect(() => {
  //   // get the devices from the backend
  //   getDevices().then((devices) => {
  //     console.log("Devices: ", devices);
  //     addDevices(devices);
  //   });
  // }, [addDevices]);

  return (
    <Grid
      container
      spacing={0}
      alignItems='baseline'
      style={{ justifyContent: "center", paddingBottom: "20px" }}
    >
      {exploreHD_cards}
    </Grid>
  );
};

export default CamerasPage;
