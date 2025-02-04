import FormGroup from "@mui/material/FormGroup";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import AccordionDetails from "@mui/material/AccordionDetails";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import IconButton from "@mui/material/IconButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkedCameraIcon from "@mui/icons-material/LinkedCamera";
import AddIcon from "@mui/icons-material/Add";
import Paper from "@mui/material/Paper";
import { useSnackbar } from "notistack";
import React, { useState, useEffect, useContext } from "react";
import { styles } from "../../../style";
import { Device, encodeType } from "../types";
import { unconfigureStream, configureStream, restartStream } from "../api";
import { DeviceSwitch } from "./DeviceSwitch";
import { DeviceLeader } from "./DeviceLeader";
import { subscribe } from "valtio";
import DeviceContext from "../../../contexts/DeviceContext";
import { IP_REGEX } from "../../../utils/utils";

/*
 * Get the list of resolutions available from the device
 */
const getResolutions = (device: Device, encodeFormat: encodeType) => {
    let newResolutions: string[] = [];
    console.log(encodeFormat);
    // TODO FIX THIS
    for (let camera of device.cameras) {
        let format = camera.formats[encodeFormat as string];
        if (format) {
            for (let resolution of format) {
                let resolution_str = `${resolution.width}x${resolution.height}`;
                if (newResolutions.includes(resolution_str)) continue;
                newResolutions.push(resolution_str);
            }
        }
    }
    return newResolutions;
};

const ENCODERS = ["H264", "MJPG"];

export const StreamOptions: React.FC = () => {
    const {
        device,
        devices,
        enableStreamUpdate,
        removeLeaderUpdate,
        setFollowerUpdate,
        nextPort,
        defaultHost,
    } = useContext(DeviceContext) as {
        device: Device;
        devices: Device[];
        enableStreamUpdate: (bus_info: string) => void;
        removeLeaderUpdate: (bus_info: string) => void;
        setFollowerUpdate: (
            leader_bus_info: string,
            follower_bus_info: string | undefined
        ) => void;
        nextPort: number;
        defaultHost: string;
    };

    const [host, setHost] = useState(defaultHost);
    const [port, setPort] = useState(nextPort);

    const [leaders, setLeaders] = useState([] as Device[]);

    const { enqueueSnackbar } = useSnackbar();

    const [streamUpdatedTimeout, setStreamUpdatedTimeout] =
        useState<NodeJS.Timeout>();

    useEffect(() => {
        setPort(nextPort);
    }, [nextPort]);

    useEffect(() => {
        console.log("Devices updated");
        setLeaders(devices.filter((dev) => dev.is_leader));
    }, [devices]);

    useEffect(() => {
        subscribe(device.stream, () => {
            if (!device.stream.configured) {
                if (device.leader) {
                    setFollowerUpdate(device.leader, undefined);
                    device.leader = undefined;
                } else if (device.is_leader && device.follower) {
                    removeLeaderUpdate(device.follower);
                    device.follower = undefined;
                }
                setStreamUpdatedTimeout(
                    setTimeout(() => {
                        unconfigureStream(device.bus_info);
                    }, 250)
                );
            } else {
                streamUpdated();
            }
        });
    }, []);

    /**
     * Update the stream
     */
    const streamUpdated = () => {
        setStreamUpdatedTimeout(
            setTimeout(() => {
                // unconfigureStream(props.device.bus_info);
                configureStream(
                    device.bus_info,
                    {
                        width: device.stream.width,
                        height: device.stream.height,
                        interval: {
                            numerator: 1,
                            denominator: device.stream.interval.denominator,
                        },
                    },
                    device.stream.encode_type,
                    device.stream.endpoints
                );
            }, 250)
        );
    };

    const handleAddEndpoint = () => {
        // Check if the IP is valid
        const validIP: boolean = IP_REGEX.test(host);
        if (!validIP) {
            enqueueSnackbar("Error: Invalid IP Address", { variant: "error" });
        }
        // Check if the port is valid
        const validPort: boolean = port >= 1024 && port <= 65535;
        if (!validPort) {
            enqueueSnackbar("Error: Invalid Port", { variant: "error" });
        }
        // Perform necessary actions with the valid IP and port values
        if (validIP && validPort) {
            if (
                device.stream.endpoints.find(
                    (endpoint) =>
                        endpoint.host === host && endpoint.port === port
                )
            ) {
                enqueueSnackbar("Error: IP and Port Already In Use", {
                    variant: "error",
                });
                return;
            } else {
                // Tell the user an endpoint as been added
                enqueueSnackbar(`Endpoint added: ${host}:${port}`, {
                    variant: "info",
                });
                device.stream.endpoints.push({ host, port });
            }
        }
    };

    const [resolutions, setResolutions] = useState([] as string[]);
    const [intervals, setIntervals] = useState([] as string[]);

    const getFormatString = () => {
        let cameraFormat: string = device.stream.encode_type;
        return cameraFormat;
    };

    useEffect(() => {
        let newResolutions = getResolutions(device, device.stream.encode_type);
        setResolutions(newResolutions);
    }, [device.stream.encode_type]);

    useEffect(() => {
        let cameraFormat = getFormatString();
        let newIntervals: string[] = [];
        for (let camera of device.cameras) {
            let format = camera.formats[cameraFormat];
            if (format) {
                for (let resolution of format) {
                    for (let interval of resolution.intervals) {
                        if (
                            !newIntervals.includes(
                                interval.denominator.toString()
                            )
                        )
                            newIntervals.push(interval.denominator.toString());
                    }
                }
            }
        }
        setIntervals(newIntervals);
    }, [resolutions]);

    const [encoders, setEncoders] = useState([] as string[]);

    useEffect(() => {
        let newEncoders = [];
        for (let camera of device.cameras) {
            for (let format in camera.formats) {
                if (ENCODERS.includes(format)) {
                    newEncoders.push(format);
                }
            }
        }
        setEncoders(newEncoders);
    }, []);

    return (
        <FormGroup
            style={{
                display: "flex",
                width: "100%",
            }}
        >
            <DeviceSwitch
                disabled={false}
                onChange={() => {
                    device.stream.configured = !device.stream.configured;
                }}
                checked={device.stream.configured}
                name='streamSwitch'
                text='Stream'
            />
            {(device.is_leader === undefined ? true : true) ? ( // TODO: change this but this is just for now until global state exists
                device.stream.configured ? (
                    <>
                        {(
                            device.is_leader === undefined
                                ? false
                                : !device.is_leader
                        ) ? (
                            <DeviceLeader leaders={leaders} />
                        ) : undefined}
                        <div style={styles.cardContent.div}>
                            <TextField
                                sx={{ width: "50%" }}
                                select
                                label='Resolution'
                                variant='outlined'
                                defaultValue={`${device.stream.width}x${device.stream.height}`}
                                onChange={(selected) => {
                                    let [width, height] =
                                        selected.target.value.split("x");
                                    device.stream.width = parseInt(width);
                                    device.stream.height = parseInt(height);
                                }}
                                size='small'
                            >
                                {resolutions.map((resolution) => (
                                    <MenuItem
                                        key={resolution}
                                        value={resolution}
                                    >
                                        {resolution}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                sx={{ width: "20%" }}
                                select
                                label='FPS'
                                variant='outlined'
                                defaultValue={
                                    device.stream.interval.denominator
                                }
                                onChange={(selected) => {
                                    device.stream.interval.denominator =
                                        parseInt(selected.target.value);
                                }}
                                size='small'
                            >
                                {intervals.map((interval) => (
                                    <MenuItem key={interval} value={interval}>
                                        {interval}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                sx={{ width: "30%" }}
                                select
                                label='Format'
                                variant='outlined'
                                defaultValue={
                                    device.stream.encode_type
                                        ? device.stream.encode_type
                                        : encodeType.H264
                                }
                                onChange={(selected) =>
                                    (device.stream.encode_type = selected.target
                                        .value as encodeType)
                                }
                                size='small'
                            >
                                {encoders.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </div>
                        <Paper sx={{ marginBottom: "10px" }}>
                            {device.stream.endpoints.length === 0 ? (
                                <Typography
                                    fontWeight='500'
                                    style={{
                                        width: "100%",
                                        textAlign: "center",
                                        padding: "25px",
                                    }}
                                >
                                    No stream endpoint added
                                </Typography>
                            ) : (
                                <List
                                    dense={true}
                                    sx={{ maxHeight: 200, overflow: "auto" }}
                                >
                                    {device.stream.endpoints.map((endpoint) => {
                                        return (
                                            <ListItem
                                                key={`${endpoint.host}:${endpoint.port}`}
                                                secondaryAction={
                                                    <IconButton
                                                        edge='end'
                                                        aria-label='icon
                                                                '
                                                        onClick={() => {
                                                            device.stream.endpoints =
                                                                device.stream.endpoints.filter(
                                                                    (e) =>
                                                                        `${e.host}:${e.port}` !==
                                                                        `${endpoint.host}:${endpoint.port}`
                                                                );
                                                        }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                }
                                            >
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        <LinkedCameraIcon />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={`IP Address: ${endpoint.host}`}
                                                    secondary={`Port: ${endpoint.port}`}
                                                />
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            )}
                        </Paper>
                        {/* Container for User Input and Interaction */}
                        <div style={styles.cardContent.div}>
                            {/* IP Address input */}
                            <TextField
                                sx={styles.textField}
                                label='IP Address'
                                variant='outlined'
                                size='small'
                                value={host}
                                onChange={(e) => setHost(e.target.value)}
                            />
                            {/* Port Input */}
                            <TextField
                                sx={styles.portField}
                                label='Port'
                                variant='outlined'
                                size='small'
                                value={port}
                                onChange={(e) =>
                                    setPort(parseInt(e.target.value))
                                }
                                type='number'
                                inputProps={{ min: 1024, max: 65535 }} // Specify minimum and maximum values
                            />
                            {/* Add Stream Endpoint Button */}
                            <IconButton
                                sx={{
                                    width: "40px",
                                    height: "40px",
                                    color: "text.secondary",
                                    marginLeft: "-10px",
                                }}
                                onClick={() => {
                                    handleAddEndpoint();
                                }}
                            >
                                <AddIcon />
                            </IconButton>
                        </div>
                        <Button
                            color='primary'
                            variant='contained'
                            onClick={() => {
                                restartStream(device.bus_info).then(() => {
                                    enqueueSnackbar("Stream restarted", {
                                        variant: "info",
                                    });
                                });
                            }}
                        >
                            Restart Stream
                        </Button>
                    </>
                ) : undefined
            ) : undefined}
        </FormGroup>
    );
};
