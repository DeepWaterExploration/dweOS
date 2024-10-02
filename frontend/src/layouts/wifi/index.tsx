import Grid from "@mui/material/Grid";
import React from "react";
import NetworkSettingsCard from "./NetworkSettings";
import KnownNetworksCard from "./KnownNetworksCard";

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
        </Grid>
    );
};

export default Wifi;
