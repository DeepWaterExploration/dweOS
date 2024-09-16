import Grid from "@mui/material/Grid";
import React, { useEffect, useState } from "react";
import LightCard from "../../components/LightCard";
import { Fab, List, Menu, MenuItem, Popover, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { styles } from "../../style";
import { LightDevice } from "../../types/types";
import LightContext from "../../contexts/LightContext";
import { useProxy } from "valtio/utils";
import { proxy, subscribe } from "valtio";
import { useSnackbar } from "notistack";
import { getLights, disablePin, setIntensity } from "../../utils/api";

const Lights = () => {
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

export default Lights;
