import Grid from "@mui/material/Grid";
import React, { useEffect, useState } from "react";
import LightCard from "./components/LightCard";
import { LightDevice } from "./types";
import LightContext from "../../contexts/LightContext";
import { proxy, subscribe } from "valtio";
import { useSnackbar } from "notistack";
import { getLights, setIntensity } from "./api";

const LightsLayout = () => {
    const { enqueueSnackbar } = useSnackbar();

    const [lights, setLights] = useState([] as LightDevice[]);

    useEffect(() => {
        getLights().then((lights) => {
            if (lights.length === 0) {
                enqueueSnackbar("No PWM Devices Detected", {
                    variant: "warning",
                });
            }
            setLights(lights);
        });
    }, []);

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
                {lights.map((lightValue, index) => {
                    const light = proxy(lightValue);

                    subscribe(light, () => {
                        setIntensity(index, light.intensity);
                    });

                    return (
                        <LightContext.Provider key={index} value={{ light }}>
                            <LightCard key={index} />
                        </LightContext.Provider>
                    );
                })}
            </Grid>
        </>
    );
};

export default LightsLayout;
