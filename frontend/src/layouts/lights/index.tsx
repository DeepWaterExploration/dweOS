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
import {
    getLights,
    getPins,
    getPWMControllers,
    removeLight,
    setLight,
} from "../../utils/api";

const Lights = () => {
    const { enqueueSnackbar } = useSnackbar();

    const [lights, setLights] = useState([] as LightDevice[]);

    const [pwmControllers, setPwmControllers] = useState([] as string[]);
    const [pinDict, setPinDict] = useState([] as {});

    const [hover, setHover] = useState(false);

    useEffect(() => {
        getPWMControllers().then((controllers) =>
            setPwmControllers(controllers)
        );
    }, []);

    useEffect(() => {
        let pinDictTemp = {};
        pwmControllers.forEach((name, index) => {
            getPins(index + "").then((pins) => (pinDictTemp[name] = pins));
        });
        setPinDict(pinDictTemp);
    }, [pwmControllers]);

    const deleteLight = (index: number) => {
        removeLight(index);
        setLights((prevLights) => prevLights.filter((_, i) => i !== index));
        enqueueSnackbar("Deleted light", {
            variant: "info",
        });
    };

    const addLight = (light: LightDevice) => {
        setLight(lights.length, light);
        setLights((prevLights) => [...prevLights, light]);
        enqueueSnackbar("Added new light", {
            variant: "info",
        });
    };

    useEffect(() => {
        getLights().then((lights) => {
            setLights(Object.values(lights));
        });
    }, []);

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

                    subscribe(light, () => {
                        setLight(index, light);
                    });

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
                onMouseOver={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
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
                            addLight({
                                pin: 4,
                                intensity: 1,
                                controller_index: 0,
                                nickname: "",
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
