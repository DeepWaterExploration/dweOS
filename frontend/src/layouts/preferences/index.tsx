import React, { useContext, useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { getRecommendedHost, getSettings, savePreferences } from "./api";
import { styles } from "../../style";
import { IP_REGEX } from "../../utils/utils";
import SettingsCard from "./components/SettingsCard";
import { useSnackbar } from "notistack";
import Grid from "@mui/material/Grid";
import WebsocketContext from "../../contexts/WebsocketContext";

const PreferencesLayout = () => {
    const { connected } = useContext(WebsocketContext);

    const { enqueueSnackbar } = useSnackbar();
    const [host, setHost] = useState(undefined);
    const [port, setPort] = useState(undefined);

    useEffect(() => {
        if (connected) {
            getSettings().then((settings) => {
                if (settings) {
                    setHost(settings.default_stream.host);
                    setPort(settings.default_stream.port);
                }
            });
        }
    }, [connected]);

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
            {host === undefined || port === undefined || (
                <SettingsCard cardTitle='Stream'>
                    <TextField
                        sx={styles.settingsButton.textInput}
                        label='Default Stream Host'
                        onChange={(e) => {
                            setHost(e.target.value);
                        }}
                        value={host}
                        variant='outlined'
                        size='small'
                    />
                    <TextField
                        sx={styles.settingsButton.textInput}
                        label='Default Stream Port'
                        onChange={(e) => setPort(parseInt(e.target.value))}
                        value={port}
                        variant='outlined'
                        size='small'
                        type='number'
                        inputProps={{ min: 1024, max: 65535 }}
                    />
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Button
                                sx={styles.settingsButton.button}
                                variant='contained'
                                onClick={() => {
                                    getRecommendedHost().then((host) => {
                                        setHost(host);
                                        savePreferences({
                                            default_stream: { host, port },
                                        });
                                        enqueueSnackbar("Host recommended!", {
                                            variant: "info",
                                        });
                                    });
                                }}
                            >
                                Recommend Host
                            </Button>
                        </Grid>
                        <Grid item xs={6}>
                            <Button
                                sx={styles.settingsButton.button}
                                variant='contained'
                                onClick={() => {
                                    if (IP_REGEX.test(host)) {
                                        savePreferences({
                                            default_stream: { host, port },
                                        });
                                        enqueueSnackbar("Saved Preferences!", {
                                            variant: "info",
                                        });
                                    } else
                                        enqueueSnackbar("Invalid IP Address", {
                                            variant: "error",
                                        });
                                }}
                            >
                                Save
                            </Button>
                        </Grid>
                    </Grid>
                </SettingsCard>
            )}
        </Grid>
    );
};

export default PreferencesLayout;
