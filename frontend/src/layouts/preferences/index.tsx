import React, { useContext, useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { getRecommendedHost, getSettings, savePreferences } from "./api";
import { styles } from "../../style";
import { IP_REGEX } from "../../utils/utils";
import SettingsCard from "./components/SettingsCard";
import { useSnackbar } from "notistack";
import Grid from "@mui/material/Grid";
import WebsocketContext from "../../contexts/WebsocketContext";
import Divider from "@mui/material/Divider";

const PreferencesLayout = () => {
    const { connected } = useContext(WebsocketContext);

    const { enqueueSnackbar } = useSnackbar();
    const [host, setHost] = useState(undefined);
    const [port, setPort] = useState(undefined);

    const [recommendHost, setRecommendHost] = useState(false);

    useEffect(() => {
        if (connected) {
            getSettings().then(async (settings) => {
                if (settings) {
                    if (settings.suggest_host) {
                        settings.default_stream.host =
                            await getRecommendedHost(); // recommend host based on IP
                    }
                    setHost(settings.default_stream.host);
                    setPort(settings.default_stream.port);
                    setRecommendHost(settings.suggest_host);
                }
            });
        }
    }, [connected]);

    useEffect(() => {
        if (recommendHost) getRecommendedHost().then(setHost);
    }, [recommendHost]);

    useEffect(() => {
        if (connected && host && port && recommendHost !== undefined) {
            if (!IP_REGEX.test(host) || port < 1024 || port > 65535) {
                return;
            }
            savePreferences({
                suggest_host: recommendHost,
                default_stream: { host, port },
            });
        }
    }, [recommendHost, host, port]);

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
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                sx={styles.settingsButton.textInput}
                                label='Default Stream Host'
                                disabled={recommendHost}
                                onChange={(e) => setHost(e.target.value)}
                                value={host}
                                variant='outlined'
                                size='small'
                                fullWidth
                                error={!IP_REGEX.test(host)}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                sx={styles.settingsButton.textInput}
                                label='Default Stream Port'
                                onChange={(e) =>
                                    setPort(parseInt(e.target.value))
                                }
                                value={port}
                                variant='outlined'
                                size='small'
                                type='number'
                                inputProps={{ min: 1024, max: 65535 }}
                                fullWidth
                                error={port < 1024 || port > 65535}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={recommendHost}
                                        onChange={() =>
                                            setRecommendHost(!recommendHost)
                                        }
                                        sx={{ padding: "0.5em" }} // Reduce padding around the checkbox
                                    />
                                }
                                label='Recommend Default Host'
                                sx={{ marginLeft: "0", marginTop: "0.5em" }} // Align the label with the other elements
                            />
                        </Grid>
                    </Grid>
                </SettingsCard>
            )}
        </Grid>
    );
};

export default PreferencesLayout;
