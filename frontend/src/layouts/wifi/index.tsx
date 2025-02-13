import Grid from "@mui/material/Grid";
import React from "react";
import NetworkSettingsCard from "./NetworkSettings";
import KnownNetworksCard from "./KnownNetworksCard";
import IPConfigurationCard from "./IPConfigurationCard";

const Wifi: React.FC = () => {
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
            <NetworkSettingsCard />
            <KnownNetworksCard />
            <IPConfigurationCard />
        </Grid>
    );
};

export default Wifi;
