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
import PopupState from "material-ui-popup-state";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkedCameraIcon from "@mui/icons-material/LinkedCamera";
import AddIcon from "@mui/icons-material/Add";
import { useSnackbar } from "notistack";
import React, { useState, useEffect, useContext } from "react";
import { Stream } from "stream";
import { styles } from "../style";
import { Device, StreamEndpoint, encodeType } from "../types/types";
import {
    getNextPort,
    getLeaders,
    unconfigureStream,
    configureStream,
    removeLeader,
    setLeader,
    restartStream,
} from "../utils/api";
import { DeviceSwitch } from "./DeviceSwitch";
import { findDeviceWithBusInfo, useDidMountEffect } from "../utils/utils";
import { DeviceLeader } from "./DeviceLeader";
import DevicesContext from "../contexts/DevicesContext";
import {
    IntercomponentMessage,
    IntercomponentMessageType,
} from "../types/types";
import { proxy, subscribe } from "valtio";
import DeviceContext from "../contexts/DeviceContext";

/*
 * Get the list of resolutions available from the device
 */
const getResolutions = (device: Device, encodeFormat: encodeType) => {
    let newResolutions: string[] = [];
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

const IP_REGEX =
    /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;

export const StreamOptions: React.FC = () => {
    const {
        device,
        devices,
        enableStreamUpdate,
        removeLeaderUpdate,
        setFollowerUpdate,
    } = useContext(DeviceContext) as {
        device: Device;
        devices: Device[];
        enableStreamUpdate: (bus_info: string) => void;
        removeLeaderUpdate: (bus_info: string) => void;
        setFollowerUpdate: (
            leader_bus_info: string,
            follower_bus_info: string | undefined
        ) => void;
    };

    const [host, setHost] = useState("192.168.2.1");
    const [port, setPort] = useState(5600);

    const [fps, setFps] = useState(device.stream.interval.denominator);

    const [leaders, setLeaders] = useState([] as Device[]);

    const { enqueueSnackbar } = useSnackbar();

    const [streamUpdatedTimeout, setStreamUpdatedTimeout] =
        useState<NodeJS.Timeout>();

    // should make more things like this
    // subscribe(device, () => {
    //     setStream(device.stream.configured);
    // });

    useEffect(() => {
        console.log("Devices updated");
        setLeaders(devices.filter((dev) => dev.is_leader));
    }, [devices]);

    useEffect(() => {
        subscribe(device.stream, () => {
            console.log(device.stream.configured);

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
        // device.stream.configured = true;
        // device.stream.width = resolution.width;
        // device.stream.width = resolution.height;
        // device.stream.interval.numerator = 1;
        // device.stream.interval.denominator = fps;

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
                            denominator: fps,
                        },
                    },
                    device.stream.encode_type,
                    device.stream.endpoints
                ).then((value: Stream | undefined) => {
                    getNextPort(host).then(setPort);
                });
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
            console.log("IP:", host);
            console.log("Port:", port);
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
                // (prevEndpoints) =>
                //     [
                //         ...prevEndpoints,
                //         {
                //             host,
                //             port,
                //         },
                //     ].sort((a, b) => {
                //         // Split the IP address string into an array of octets
                //         const ipA = a.host.split(".").map(Number);
                //         const ipB = b.host.split(".").map(Number);
                //         // Compare each octet and return the comparison result
                //         for (let i = 0; i < 4; i++) {
                //             if (ipA[i] !== ipB[i]) {
                //                 return ipA[i] - ipB[i];
                //             }
                //         }
                //         // If all octets are equal, compare the port number
                //         return a.port - b.port;
                //     });
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
                                onChange={(selected) =>
                                    setFps(parseInt(selected.target.value))
                                }
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
                        <Accordion
                            defaultExpanded={device.stream.endpoints.length > 0}
                            style={{
                                width: "100%",
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls='panel2a-content'
                                id='panel2a-header'
                            >
                                <Typography fontWeight='800'>
                                    Stream Endpoints
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box
                                    sx={{
                                        backgroundColor: "background.paper",
                                    }}
                                >
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
                                        <List dense={true}>
                                            {device.stream.endpoints.map(
                                                (endpoint) => {
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
                                                                                (
                                                                                    e
                                                                                ) =>
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
                                                }
                                            )}
                                        </List>
                                    )}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
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
