import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import React from "react";
import { styles } from "../../style";

const TerminalLayout = () => {
    return (
        <Grid
            container
            spacing={4}
            alignItems='baseline'
            flexWrap='wrap'
            style={{
                justifyContent: "space-evenly",
                height: "100%",
            }}
        >
            <Card sx={{ ...styles.card, height: "90%", width: "90%" }}>
                <iframe
                    height='100%'
                    width='100%'
                    style={{ border: "none" }}
                    src='http://localhost:8000'
                />
            </Card>
        </Grid>
    );
};

export default TerminalLayout;
