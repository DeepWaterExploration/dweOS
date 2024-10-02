import Grid from "@mui/material/Grid";
import React, { useEffect, useState } from "react";

import { getAccessPoints, getWiFiStatus } from "./api";
import NetworkSettingsCard from "./NetworkSettings";
import { Connection, AccessPoint } from "./types";

const Wifi: React.FC = () => {
    const [currentNetwork, setCurrentNetwork] = useState(
        {} as Connection | undefined
    );
    const [accessPoints, setAccessPoints] = useState([] as AccessPoint[]);

    // Initial request
    useEffect(() => {
        getWiFiStatus().then(setCurrentNetwork);
        getAccessPoints().then(setAccessPoints);
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
                accessPoints={accessPoints}
            />
        </Grid>
    );
};

export default Wifi;
