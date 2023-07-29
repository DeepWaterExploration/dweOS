import { Grid } from "@mui/material";
import React, { useEffect, useState } from "react";

import { getAvailableWifi, getConnectedNetwork, toggleWifiStatus } from "./api";
import NetworkDetailsCard from "./NetworkDetails";
// import NetworkHistory from "./NetworkHistory";
// import NetworkSettings from "./NetworkSettings";
import { WiFiNetwork } from "./types";

const Wifi: React.FC = () => {
  const [wifiStatus, setWifiStatus] = useState<boolean | null>(null);
  const [connectedNetwork, setconnectedNetwork] = useState<WiFiNetwork | null>(
    null
  );
  const [networks, setNetworks] = useState<WiFiNetwork[]>([]);
  useEffect(() => {
    const turnOnWifi = async () => {
      setWifiStatus(await toggleWifiStatus(true));
      setconnectedNetwork(await getConnectedNetwork(networks));
      setNetworks(await getAvailableWifi());
    };
    turnOnWifi();

    const interval = setInterval(async () => {
      if (wifiStatus) {
        setconnectedNetwork(await getConnectedNetwork(networks));
        setNetworks(await getAvailableWifi());
      }
    }, 1000);

    // Clean up the interval on component unmount to avoid memory leaks
    return () => {
      clearInterval(interval);
    };
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
          connectedNetwork={connectedNetwork}
          setConnectedNetwork={setconnectedNetwork}
          networks={networks}
          setNetworks={setNetworks}
        />
      ) : (
        <div></div>
      )}
    </Grid>
  );
};

export default Wifi;
