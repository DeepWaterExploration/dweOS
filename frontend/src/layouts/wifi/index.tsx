import { Grid } from "@mui/material";
import React, { useEffect, useState } from "react";

import { getAvailableWifi, getConnectedNetwork, toggleWifiStatus } from "./api";
import NetworkDetailsCard from "./NetworkDetails";
// import NetworkHistory from "./NetworkHistory";
// import NetworkSettings from "./NetworkSettings";
import { WiFiNetwork } from "./types";

const Wifi: React.FC = () => {
  const [wifiStatus, setWifiStatus] = useState<boolean | null>(null);
  const [connectedNetwork, setConnectedNetwork] = useState<WiFiNetwork | null>(
    null
  );
  const [availableNetworks, setAvailableNetworks] = useState<WiFiNetwork[]>([]);

  useEffect(() => {
    const turnOnWifi = async () => {
      console.log("turning on wifi", wifiStatus);
      const newWifiStatus = await toggleWifiStatus(true);
      setWifiStatus(newWifiStatus); // Update state using the temporary variable
      console.log("wifi: ", newWifiStatus);
      const networks = await getAvailableWifi();
      setAvailableNetworks(networks);
      console.log("available networks: ", networks);
      const connectedNetwork = await getConnectedNetwork(networks);
      setConnectedNetwork(connectedNetwork);
      console.log("connected network: ", connectedNetwork);
    };
    turnOnWifi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {wifiStatus !== null && (
        <NetworkDetailsCard
          wifiStatus={wifiStatus}
          setWifiStatus={setWifiStatus}
          connectedNetwork={connectedNetwork}
          setConnectedNetwork={setConnectedNetwork}
          networks={availableNetworks}
          setNetworks={setAvailableNetworks}
        />
      )}
    </Grid>
  );
};

export default Wifi;
