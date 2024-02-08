import AddIcon from "@mui/icons-material/Add";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LinkedCameraIcon from "@mui/icons-material/LinkedCamera";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    FormControlLabel,
    FormGroup,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Menu,
    MenuItem,
    Slider,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state";
import { useSnackbar } from "notistack";
import React, { useEffect, useRef, useState } from "react";

import { styles } from "./style";
import {
    CameraFormatSize,
    Control,
    Device,
    Stream,
    StreamEndpoint,
    bitrateMode,
    controlType,
    encodeType,
    optionType,
} from "../../types/types";
import {
    configureStream,
    getNextPort,
    restartStream,
    setDeviceNickname,
    setExploreHDOption,
    setUVCControl,
    unconfigureStream,
} from "../../utils/api";

const RESOLUTIONS = [
    "1920x1080",
    "1280x720",
    "800x600",
    "640x480",
    "640x360",
    "352x288",
    "320x420",
];

const INTERVALS = ["30", "25", "20", "15", "10"];

const ENCODERS = ["H264", "MJPEG"];

const useDidMountEffect = (
    func: React.EffectCallback,
    deps?: React.DependencyList | undefined
) => {
    const didMount = useRef(false);

    useEffect(() => {
        if (didMount.current) func();
        else didMount.current = true;
    }, deps);
};

const IP_REGEX =
    /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;

interface SupportingTextProps {
    children: React.ReactNode;
}

const SupportingText: React.FC<SupportingTextProps> = (props) => {
    return (
        <Typography
            sx={{ fontSize: 14 }}
            color='text.secondary'
            gutterBottom
            marginBottom='14px'
        >
            {props.children}
        </Typography>
    );
};

interface DeviceSwitchProps {
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    name: string;
    checked: boolean;
    text: string;
}

const DeviceSwitch: React.FC<DeviceSwitchProps> = (props) => {
    return (
        <FormControlLabel
            control={
                <Switch
                    name={props.name}
                    checked={props.checked}
                    onChange={props.onChange}
                />
            }
            label={<Typography color='text.secondary'>{props.text}</Typography>}
        />
    );
};

interface DeviceOptionsProps {
    device: Device;
}

const DeviceOptions: React.FC<DeviceOptionsProps> = (props) => {
    // const device = props.device.stream.device_path;

    const [bitrate, setBitrate] = useState(
        props.device.options.bitrate / 1000000
    );
    const [bitrateSlider, setBitrateSlider] = useState(
        props.device.options.bitrate / 1000000
    );
    const [gop, setGOP] = useState(props.device.options.gop);
    const [gopSlider, setGOPSlider] = useState(props.device.options.gop);
    const [mode, setMode] = useState(props.device.options.mode);

    useDidMountEffect(() => {
        setExploreHDOption(
            props.device.bus_info,
            optionType.BITRATE,
            bitrate * 1000000
        );
    }, [bitrate]);

    useDidMountEffect(() => {
        setExploreHDOption(props.device.bus_info, optionType.MODE, mode);
        if (mode === bitrateMode.VBR) {
            setGOP(29);
        }
    }, [mode]);

    useDidMountEffect(() => {
        setExploreHDOption(props.device.bus_info, optionType.GOP, gop);
    }, [gop]);

    return (
        <FormGroup>
            <Grid
                container
                direction='row'
                justifyContent='space-between'
                alignItems='center'
            >
                <Grid
                    container
                    direction='column'
                    justifyContent='center'
                    alignItems='center'
                    width='50%'
                >
                    <Typography fontWeight='800' style={{ width: "100%" }}>
                        Bitrate: {bitrateSlider} Mbps
                    </Typography>
                    <Slider
                        name='bitrate'
                        defaultValue={props.device.options.bitrate / 1000000}
                        disabled={mode === bitrateMode.VBR}
                        onChangeCommitted={(_, newValue) => {
                            setBitrate(newValue as number);
                        }}
                        onChange={(_, newValue) => {
                            setBitrateSlider(newValue as number);
                        }}
                        style={{ width: "calc(100% - 30px)" }}
                        size='small'
                        max={15}
                        min={0.1}
                        step={0.1}
                    />
                </Grid>
                <Grid
                    container
                    direction='column'
                    justifyContent='center'
                    alignItems='center'
                    width='50%'
                >
                    <Typography fontWeight='800' style={{ width: "100%" }}>
                        Group of Pictures {gopSlider}
                    </Typography>
                    <Slider
                        name='bitrate'
                        defaultValue={props.device.options.gop}
                        disabled={mode === bitrateMode.VBR}
                        onChangeCommitted={(_, newValue) => {
                            setGOP(newValue as number);
                        }}
                        onChange={(_, newValue) => {
                            setGOPSlider(newValue as number);
                        }}
                        style={{ width: "calc(100% - 30px)" }}
                        size='small'
                        max={29}
                        min={0}
                        step={1}
                    />
                </Grid>
            </Grid>
            <DeviceSwitch
                checked={mode === bitrateMode.VBR}
                name='vbrSwitch'
                onChange={(e) => {
                    setMode(
                        e.target.checked ? bitrateMode.VBR : bitrateMode.CBR
                    );
                }}
                text='VBR (Variable Bitrate)'
            />
        </FormGroup>
    );
};

interface StreamOptionsProps {
    device: Device;
}

const StreamOptions: React.FC<StreamOptionsProps> = (props) => {
    const [stream, setStream] = useState(props.device.stream.configured);

    const [host, setHost] = useState("192.168.2.1");
    const [port, setPort] = useState(5600);
    const [ipError, setIpError] = useState("");
    const [portError, setPortError] = useState("");

    const { enqueueSnackbar } = useSnackbar();

    const [resolution, setResolution] = useState("1920x1080");
    const [encodeFormat, setEncodeFormat] = useState(encodeType.H264);
    const [fps, setFps] = useState("30");
    const [endpoints, setEndpoints] = useState<StreamEndpoint[]>(
        props.device.stream.endpoints ? props.device.stream.endpoints : []
    );

    const [streamUpdatedTimeout, setStreamUpdatedTimeout] =
        useState<NodeJS.Timeout>();

    useEffect(() => {
        getNextPort(host).then(setPort);
    }, []);

    useDidMountEffect(() => {
        if (!stream) {
            setStreamUpdatedTimeout(
                setTimeout(() => {
                    unconfigureStream(props.device.bus_info);
                }, 250)
            );
        } else {
            streamUpdated();
        }
    }, [stream, endpoints, resolution, fps, encodeFormat]);

    /**
     * Update the stream
     */
    const streamUpdated = () => {
        const [width, height] = resolution.split("x");
        setStreamUpdatedTimeout(
            setTimeout(() => {
                configureStream(
                    props.device.bus_info,
                    {
                        width: parseInt(width),
                        height: parseInt(height),
                        interval: {
                            numerator: 1,
                            denominator: parseInt(fps),
                        },
                    },
                    encodeFormat,
                    endpoints
                ).then((value: Stream | undefined) => {
                    if (value !== undefined) {
                        props.device.stream = value;
                        if (streamUpdatedTimeout)
                            clearTimeout(streamUpdatedTimeout);
                    }
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
                endpoints.find(
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
                setEndpoints((prevEndpoints) =>
                    [
                        ...prevEndpoints,
                        {
                            host,
                            port,
                        },
                    ].sort((a, b) => {
                        // Split the IP address string into an array of octets
                        const ipA = a.host.split(".").map(Number);
                        const ipB = b.host.split(".").map(Number);
                        // Compare each octet and return the comparison result
                        for (let i = 0; i < 4; i++) {
                            if (ipA[i] !== ipB[i]) {
                                return ipA[i] - ipB[i];
                            }
                        }
                        // If all octets are equal, compare the port number
                        return a.port - b.port;
                    })
                );
            }
        }
    };
    return (
        <FormGroup
            style={{
                display: "flex",
                width: "100%",
            }}
        >
            <DeviceSwitch
                onChange={(e) => {
                    setStream(e.target.checked);
                }}
                checked={stream}
                name='streamSwitch'
                text='Stream'
            />
            {stream ? (
                <>
                    <div style={styles.cardContent.div}>
                        <TextField
                            sx={{ width: "50%" }}
                            select
                            label='Resolution'
                            variant='outlined'
                            defaultValue='1920x1080'
                            onChange={(selected) =>
                                setResolution(selected.target.value)
                            }
                            size='small'
                        >
                            {RESOLUTIONS.map((resolution) => (
                                <MenuItem key={resolution} value={resolution}>
                                    {resolution}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            sx={{ width: "20%" }}
                            select
                            label='FPS'
                            variant='outlined'
                            defaultValue='30'
                            onChange={(selected) =>
                                setFps(selected.target.value)
                            }
                            size='small'
                        >
                            {INTERVALS.map((interval) => (
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
                                props.device.stream.encode_type
                                    ? props.device.stream.encode_type
                                    : encodeType.H264
                            }
                            onChange={(selected) =>
                                setEncodeFormat(
                                    selected.target.value as encodeType
                                )
                            }
                            size='small'
                        >
                            {ENCODERS.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>
                    </div>
                    <Accordion
                        defaultExpanded={endpoints.length > 0}
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
                                {endpoints.length === 0 ? (
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
                                        {endpoints.map((endpoint) => {
                                            return (
                                                <ListItem
                                                    key={`${endpoint.host}:${endpoint.port}`}
                                                    secondaryAction={
                                                        <IconButton
                                                            edge='end'
                                                            aria-label='delete'
                                                            onClick={() => {
                                                                setEndpoints(
                                                                    (
                                                                        prevEndpoints
                                                                    ) =>
                                                                        prevEndpoints.filter(
                                                                            (
                                                                                e
                                                                            ) =>
                                                                                `${e.host}:${e.port}` !==
                                                                                `${endpoint.host}:${endpoint.port}`
                                                                        )
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
                            error={!!ipError}
                            helperText={ipError}
                        />
                        {/* Port Input */}
                        <TextField
                            sx={styles.portField}
                            label='Port'
                            variant='outlined'
                            size='small'
                            value={port}
                            onChange={(e) => setPort(parseInt(e.target.value))}
                            error={!!portError}
                            helperText={portError}
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
                            restartStream(props.device.bus_info).then(() => {
                                enqueueSnackbar("Stream restarted", {
                                    variant: "info",
                                });
                            });
                        }}
                    >
                        Restart Stream
                    </Button>
                </>
            ) : undefined}
        </FormGroup>
    );
};

interface CameraControlsProps {
    controls: Control[];
    usbInfo: string;
}

interface ControlState {
    control_id: number;
    name: string;
    setControlValue:
        | ((value: number) => void)
        | ((value: boolean) => void)
        | ((value: string) => void);
    default_value: number | string | boolean;
    type: controlType;
}

const CameraControls: React.FC<CameraControlsProps> = (props) => {
    const { controls, usbInfo } = props;

    const setStatesList: ControlState[] = [];

    return (
        <Accordion
            style={{
                width: "100%",
                marginTop: "20px",
                visibility: "visible",
                // border: "1px solid rgb(117, 117, 117)",
                // borderRadius: "5px",
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls='panel2a-content'
                id='panel2a-header'
            >
                <Typography fontWeight='800'>Camera Controls</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <FormGroup style={{ marginTop: "20px" }}>
                    {controls.map((control) => {
                        // Extremely Hacky Fix for Auto Exposure: Change in backend later
                        if (
                            control.name.includes("Auto Exposure") &&
                            control.flags.control_type === controlType.MENU
                        ) {
                            control.flags.control_type = controlType.BOOLEAN;
                        }
                        switch (control.flags.control_type) {
                            case controlType.INTEGER: {
                                const { name, control_id, value } = control;
                                const {
                                    min_value,
                                    max_value,
                                    step,
                                    default_value,
                                } = control.flags;
                                const [controlValue, setControlValue] =
                                    useState<number>(value as number);
                                const [
                                    controlValueSlider,
                                    setControlValueSlider,
                                ] = useState<number>(value as number);
                                setStatesList.push({
                                    control_id,
                                    name,
                                    setControlValue,
                                    default_value,
                                    type: control.flags.control_type,
                                } as ControlState);

                                useDidMountEffect(() => {
                                    setUVCControl(
                                        usbInfo,
                                        controlValue,
                                        control_id
                                    );
                                    setControlValueSlider(controlValue);
                                }, [controlValue]);

                                return (
                                    <>
                                        <span>
                                            {name}: {controlValueSlider}
                                        </span>
                                        <Slider
                                            onChangeCommitted={(
                                                _,
                                                newValue
                                            ) => {
                                                setControlValue(
                                                    newValue as number
                                                );
                                            }}
                                            onChange={(_, newValue) => {
                                                setControlValueSlider(
                                                    newValue as number
                                                );
                                            }}
                                            name={`control-${control_id}`}
                                            min={min_value}
                                            max={max_value}
                                            step={step}
                                            value={controlValueSlider}
                                            defaultValue={value as number}
                                            style={{
                                                marginLeft: "20px",
                                                width: "calc(100% - 25px)",
                                            }}
                                        />
                                    </>
                                );
                            }
                            case controlType.BOOLEAN: {
                                // Hacky fix for auto exposure: FIXME: Change in backend
                                let VALUE_TRUE = 1;
                                let VALUE_FALSE = 0;
                                if (control.name.includes("Auto Exposure")) {
                                    VALUE_TRUE = 3;
                                    VALUE_FALSE = 1;
                                }
                                let { name, control_id } = control;
                                let { default_value } = control.flags;
                                const value =
                                    control.value === VALUE_TRUE ? true : false;
                                if (name.includes("White Balance")) {
                                    name = "AI TrueColor Technology™";
                                }
                                const [controlValue, setControlValue] =
                                    useState<boolean>(value as boolean);

                                setStatesList.push({
                                    control_id,
                                    name,
                                    setControlValue,
                                    default_value,
                                    type: control.flags.control_type,
                                });

                                useDidMountEffect(() => {
                                    setUVCControl(
                                        usbInfo,
                                        controlValue ? VALUE_TRUE : VALUE_FALSE,
                                        control_id
                                    );
                                }, [controlValue]);

                                return (
                                    <>
                                        <span>{name}</span>
                                        <Switch
                                            checked={controlValue}
                                            onChange={(_, checked) => {
                                                setControlValue(!controlValue);
                                            }}
                                            name={`control-${control_id}`}
                                            defaultChecked={value}
                                        />
                                    </>
                                );
                            }
                            case controlType.MENU: {
                                const { name, control_id } = control;
                                const { menu, default_value } = control.flags;
                                if (!menu) break;

                                // let menuObject: { [name: string]: number } = {};
                                // for (const menuItem of menu) {
                                //   menuObject[menuItem] =
                                // }

                                // Hacky fix for auto exposure bug in camera firmware
                                // if (name.includes("Auto Exposure") && menu.length === 2) {
                                //   menuObject = {
                                //     Automatic: 3,
                                //     "Manual Mode": 1,
                                //   };
                                // }

                                // const value = Object.keys(menuObject).find(
                                //   (key) => menuObject[key] === control.value
                                // );

                                const [controlValue, setControlValue] =
                                    useState<number>(control.value!);

                                console.log(menu);

                                if (control.value) {
                                    setStatesList.push({
                                        control_id,
                                        name,
                                        setControlValue,
                                        default_value,
                                        type: control.flags.control_type,
                                    });
                                }

                                useDidMountEffect(() => {
                                    setUVCControl(
                                        usbInfo,
                                        controlValue,
                                        control_id
                                    );
                                }, [controlValue]);

                                return (
                                    <>
                                        <PopupState
                                            variant='popover'
                                            popupId={"" + control_id}
                                        >
                                            {(popupState) => (
                                                <>
                                                    <div>
                                                        <span>
                                                            {name}:
                                                            {
                                                                menu.find(
                                                                    (
                                                                        menuItem
                                                                    ) =>
                                                                        menuItem.index ==
                                                                        controlValue
                                                                )!.name
                                                            }
                                                        </span>
                                                        <IconButton
                                                            {...bindTrigger(
                                                                popupState
                                                            )}
                                                        >
                                                            <ArrowDropDownIcon />
                                                        </IconButton>
                                                    </div>
                                                    <Menu
                                                        {...bindMenu(
                                                            popupState
                                                        )}
                                                    >
                                                        {menu.map(
                                                            (menuItem) => {
                                                                return (
                                                                    <MenuItem
                                                                        key={
                                                                            menuItem.index
                                                                        }
                                                                        onClick={() => {
                                                                            console.log(
                                                                                menuItem.index,
                                                                                menuItem.name
                                                                            );
                                                                            setControlValue(
                                                                                menuItem.index
                                                                            );
                                                                            popupState.close();
                                                                        }}
                                                                    >
                                                                        {
                                                                            menuItem.name
                                                                        }
                                                                    </MenuItem>
                                                                );
                                                            }
                                                        )}
                                                    </Menu>
                                                </>
                                            )}
                                        </PopupState>
                                    </>
                                );
                            }
                        }
                    })}
                </FormGroup>
                <LineBreak />
                <Button
                    sx={{ width: "100%" }}
                    variant='outlined'
                    onClick={() => {
                        for (const control of setStatesList) {
                            switch (control.type) {
                                case controlType.INTEGER:
                                    (
                                        control.setControlValue as (
                                            value: number
                                        ) => void
                                    )(control.default_value as number);
                                    break;
                                case controlType.BOOLEAN:
                                    (
                                        control.setControlValue as (
                                            value: boolean
                                        ) => void
                                    )(control.default_value as boolean);
                                    break;
                                case controlType.MENU:
                                    (
                                        control.setControlValue as (
                                            value: string
                                        ) => void
                                    )(control.default_value as string);
                                    break;
                            }
                        }
                    }}
                >
                    Reset Controls
                </Button>
            </AccordionDetails>
        </Accordion>
    );
};

const LineBreak: React.FC = () => {
    return <br></br>;
};

export interface DeviceCardProps {
    key: number;
    device: Device;
}

const DeviceCard: React.FC<DeviceCardProps> = (props) => {
    const controls = props.device.controls;
    console.log(controls);

    const deviceOptions = <DeviceOptions device={props.device} />;
    const deviceWarning = null;

    const cameraControls = (
        <CameraControls controls={controls} usbInfo={props.device.bus_info} />
    );

    return (
        <Card
            sx={{
                minWidth: 512,
                boxShadow: 3,
                textAlign: "left",
                margin: "20px",
            }}
        >
            <CardHeader
                action={deviceWarning}
                title={props.device.device_info.device_name}
                subheader={
                    <>
                        {`Manufacturer: ${props.device.manufacturer}`}
                        <LineBreak />
                        {`Model: `}
                        <LineBreak />
                        {`USB ID: ${props.device.bus_info}`}
                        <LineBreak />
                        <TextField
                            sx={{ top: 10 }}
                            onChange={(e) => {
                                props.device.nickname = e.target.value;
                                setDeviceNickname(
                                    props.device.bus_info,
                                    e.target.value
                                );
                            }}
                            helperText='Device Nickname'
                            placeholder='Device Nickname'
                            variant='standard'
                            defaultValue={props.device.nickname}
                        ></TextField>
                    </>
                }
            />
            <CardContent>
                {/* {props.device.stream.device_path ? (
          <SupportingText>
            Device: {props.device.stream.device_path}
          </SupportingText>
        ) : (
          <></>
        )} */}
                {deviceOptions}
                <StreamOptions device={props.device} />
                {cameraControls}
            </CardContent>
        </Card>
    );
};

export default DeviceCard;
