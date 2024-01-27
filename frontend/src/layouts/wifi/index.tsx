import { Grid } from "@mui/material";
import React, { useEffect, useState } from "react";

import { getAvailableWifi, getWifiStatus } from "./api";
import NetworkSettingsCard from "./NetworkSettings";
import { WifiStatus, ScannedWifiNetwork } from "./types";
import NetworkDetailsCard from "./NetworkDetailsCard";

const Wifi: React.FC = () => {
    const [currentNetwork, setCurrentNetwork] = useState({} as WifiStatus);
    const [scannedNetworks, setScannedNetworks] = useState(
        [] as ScannedWifiNetwork[]
    );

    // Initial request
    useEffect(() => {
        getWifiStatus().then((status: WifiStatus) => {
            setCurrentNetwork(status);
        });

        getAvailableWifi().then((scannedNetworks: ScannedWifiNetwork[]) => {
            setScannedNetworks(scannedNetworks);
        });
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
            <NetworkSettingsCard
                currentNetwork={currentNetwork}
                setCurrentNetwork={setCurrentNetwork}
                scannedNetworks={scannedNetworks}
                setScannedNetworks={setScannedNetworks}
            />
            <NetworkDetailsCard currentNetwork={currentNetwork} />
        </Grid>
    );
};

export default Wifi;
