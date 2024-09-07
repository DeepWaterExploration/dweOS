import Grid from "@mui/material/Grid";
import React, { useEffect, useState } from "react";
import LightCard from "../../components/LightCard";
import { Fab, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { styles } from "../../style";
import { LightDevice } from "../../types/types";
import LightContext from "../../contexts/LightContext";
import { useProxy } from "valtio/utils";
import { proxy, subscribe } from "valtio";
import { useSnackbar } from "notistack";

const Lights = () => {
    const { enqueueSnackbar } = useSnackbar();

    const [lights, setLights] = useState([
        { gpio_pin: 5, intensity: 0.4 },
    ] as LightDevice[]);

    const deleteLight = (index: number) => {
        setLights((prevLights) => prevLights.filter((_, i) => i !== index));
        enqueueSnackbar("Deleted light", {
            variant: "info",
        });
    };

    useEffect(() => {
        // console.log(lights.length);
    }, [lights]);

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

                    subscribe(light, () => {});

                    return (
                        <LightContext.Provider key={index} value={{ light }}>
                            <LightCard
                                key={index}
                                onClose={() => deleteLight(index)}
                            />
                        </LightContext.Provider>
                    );
                })}
            </Grid>
            <div
                style={{
                    padding: 0,
                    position: "fixed",
                    bottom: "20px",
                    right: "20px",
                    margin: "50px 0px 0px 50px",
                    height: "115px",
                    width: "115px",
                }}
                onFocus={() => {}}
            >
                <Tooltip
                    enterDelay={1000}
                    enterNextDelay={500}
                    leaveDelay={10}
                    placement='top'
                    title={"Add Light"}
                >
                    <Fab
                        sx={styles.addButton}
                        color={"info"}
                        aria-label={"Add Light Card Button"}
                        onClick={() => {
                            setLights((prevLights) => [
                                ...prevLights,
                                { gpio_pin: 4, intensity: 1 },
                            ]);
                            enqueueSnackbar("Added new light", {
                                variant: "info",
                            });
                        }}
                    >
                        <AddIcon />
                    </Fab>
                </Tooltip>
            </div>
        </>
    );
};

export default Lights;
