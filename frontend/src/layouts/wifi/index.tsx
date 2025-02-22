import Grid from "@mui/material/Grid";
import React, { useState } from "react";
import NetworkSettingsCard from "./NetworkSettings";
import KnownNetworksCard from "./KnownNetworksCard";
import IPConfigurationCard from "./IPConfigurationCard";
import { Connection } from "./types";

const Wifi: React.FC = () => {
    const [currentNetwork, setCurrentNetwork] = useState({
        id: "",
        type: "",
    } as Connection);

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
            />
            <KnownNetworksCard
                currentNetwork={currentNetwork}
                setCurrentNetwork={setCurrentNetwork}
            />
            <IPConfigurationCard />
        </Grid>
    );
};

export default Wifi;
