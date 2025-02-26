import Grid from "@mui/material/Grid";
import React from "react";
import IPConfigurationCard from "./IPConfigurationCard";

const Wired: React.FC = () => {
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
            <IPConfigurationCard />
        </Grid>
    );
};

export default Wired;
