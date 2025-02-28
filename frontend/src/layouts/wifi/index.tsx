import Grid from "@mui/material/Grid";
import React, { useState } from "react";
import NetworkSettingsCard from "./NetworkSettings";
import KnownNetworksCard from "./KnownNetworksCard";
import CircularProgress from "@mui/material/CircularProgress";
import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import { Connection } from "./types";

const Wifi: React.FC = () => {
    const [currentNetwork, setCurrentNetwork] = useState({
        id: "",
        type: "",
    } as Connection);

    const [loadingText, setLoadingText] = useState("");

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
            <Backdrop
                open={loadingText !== ""}
                sx={{ zIndex: 10, color: "#fff" }}
            >
                <Box display='flex' flexDirection='column' alignItems='center'>
                    <CircularProgress color='inherit' />
                    <Box mt={2}>{loadingText}</Box>
                </Box>
            </Backdrop>
            <NetworkSettingsCard
                currentNetwork={currentNetwork}
                setCurrentNetwork={setCurrentNetwork}
                loadingText={loadingText}
                setLoadingText={setLoadingText}
            />
            <KnownNetworksCard
                currentNetwork={currentNetwork}
                setCurrentNetwork={setCurrentNetwork}
                loadingText={loadingText}
                setLoadingText={setLoadingText}
            />
            {/* <IPConfigurationCard /> */}
        </Grid>
    );
};

export default Wifi;
