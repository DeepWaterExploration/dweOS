import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import React, { useContext, useEffect, useState } from "react";
import LightCard from "./components/LightCard";
import { LightDevice } from "./types";
import LightContext from "../../contexts/LightContext";
import { proxy, subscribe } from "valtio";
import { useSnackbar } from "notistack";
import { getLights, setIntensity } from "./api";
import { styles } from "../../style";
import WebsocketContext from "../../contexts/WebsocketContext";

const LightsLayout = () => {
    const { enqueueSnackbar } = useSnackbar();

    const [lights, setLights] = useState([] as LightDevice[]);

    const [hasRequestedLights, setHasRequestedLights] = useState(false);

    let { connected } = useContext(WebsocketContext) as { connected: boolean };

    useEffect(() => {
        if (connected) {
            getLights().then((lights) => {
                setHasRequestedLights(true);
                setLights(lights);
            });
        } else {
            setLights([]);
        }
    }, [connected]);

    return (
        <>
            <Grid
                container
                spacing={4}
                alignItems='baseline'
                flexWrap='wrap'
                style={{
                    justifyContent: "space-evenly",
                }}
            >
                {lights.length === 0 && hasRequestedLights && (
                    <Grid
                        container
                        spacing={0}
                        direction='column'
                        alignItems='center'
                        justifyContent='center'
                        sx={{ height: "60vh" }}
                    >
                        <Grid item xs={3}>
                            <Paper
                                elevation={1}
                                sx={{
                                    padding: "50px",
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    borderRadius: "15px",
                                    ...styles.card,
                                }}
                            >
                                <Typography variant='h4' component='div'>
                                    No Lights Connected
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                )}
                {connected &&
                    lights.map((lightValue, index) => {
                        const light = proxy(lightValue);

                        subscribe(light, () => {
                            setIntensity(index, light.intensity);
                        });

                        return (
                            <LightContext.Provider
                                key={index}
                                value={{ light }}
                            >
                                <LightCard key={index} />
                            </LightContext.Provider>
                        );
                    })}
            </Grid>
        </>
    );
};

export default LightsLayout;
