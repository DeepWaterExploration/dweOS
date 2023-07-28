import { Grid } from "@mui/material";
import React, { useEffect, useState } from "react";

import { getWifiStatus, toggleWifiStatus } from "./api";
import NetworkDetailsCard from "./NetworkDetails";
// import NetworkHistory from "./NetworkHistory";
// import NetworkSettings from "./NetworkSettings";
import { WiFiNetwork } from "./types";

const Wifi: React.FC = () => {
  const [wifiStatus, setWifiStatus] = useState<boolean | null>(null);
  // const [connectedNetwork, setconnectedNetwork] = useState<WiFiNetwork>();
  // const [networks, setNetworks] = useState<WiFiNetwork[]>([]);
  useEffect(() => {
    const turnOnWifi = async () => {
      setWifiStatus(await toggleWifiStatus(true));
    };
    turnOnWifi();
  }, []);

  return (
    <Grid
      container
      spacing={4}
      alignItems='baseline'
      flexWrap='wrap'
      style={{
        justifyContent: "left",
        padding: "0 3em",
      }}
    >
      {wifiStatus !== null ? (
        <NetworkDetailsCard
          wifiStatus={wifiStatus}
          setWifiStatus={setWifiStatus}
        />
      ) : (
        <div></div>
      )}
    </Grid>
  );
};

export default Wifi;
