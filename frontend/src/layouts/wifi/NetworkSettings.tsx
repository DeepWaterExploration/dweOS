import {
    Accordion,
    AccordionSummary,
    Avatar,
    Box,
    Button,
    Card,
    CardHeader,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    TextField,
    Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import {
    SignalWifi0Bar,
    SignalWifi1Bar,
    SignalWifi2Bar,
    SignalWifi3Bar,
    SignalWifi4Bar,
} from "@mui/icons-material";
import { WifiStatus, ScannedWifiNetwork } from "./types";
import { useEffect, useState } from "react";
import {
    connectToWifi,
    disconnectFromWifi,
    getAvailableWifi,
    getWifiStatus,
} from "./api";
import { useSnackbar } from "notistack";
import React from "react";

export interface SignalIconProps {
    signal_strength: number;
}

const thresholds = [-60, -70, -80, -90];

const getSignalStrength = (strength: number) => {
    if (strength >= thresholds[0]) {
        return 4;
    } else if (strength >= thresholds[1]) {
        return 3;
    } else if (strength >= thresholds[2]) {
        return 2;
    } else if (strength >= thresholds[3]) {
        return 1;
    } else {
        return 0;
    }
};

const SignalIcon: React.FC<SignalIconProps> = (props) => {
    // Define the signal strength thresholds for each bar

    // Determine the number of bars based on the signal strength
    if (props.signal_strength >= thresholds[0]) {
        return <SignalWifi4Bar sx={{ fontSize: 22.5, mx: 0.5 }} />;
    } else if (props.signal_strength >= thresholds[1]) {
        return <SignalWifi3Bar sx={{ fontSize: 22.5, mx: 0.5 }} />;
    } else if (props.signal_strength >= thresholds[2]) {
        return <SignalWifi2Bar sx={{ fontSize: 22.5, mx: 0.5 }} />;
    } else if (props.signal_strength >= thresholds[3]) {
        return <SignalWifi1Bar sx={{ fontSize: 22.5, mx: 0.5 }} />;
    } else {
        return <SignalWifi0Bar sx={{ fontSize: 22.5, mx: 0.5 }} />;
    }
};

export interface WifiSignalAvatarProps {
    signal_strength: number;
}

const WifiSignalAvatar: React.FC<WifiSignalAvatarProps> = (props) => {
    return (
        <ListItemAvatar>
            <Avatar>
                <SignalIcon signal_strength={props.signal_strength} />
            </Avatar>
        </ListItemAvatar>
    );
};

export interface WifiListItemProps {
    ssid: string;
    signal_strength: number;
    connected: boolean;
    on_connect?: () => void;
    on_disconnect?: () => void;
    secure?: boolean;
}

const WifiListItem: React.FC<WifiListItemProps> = (props) => {
    return (
        <ListItem>
            <WifiSignalAvatar signal_strength={props.signal_strength} />
            <ListItemText
                primary={props.ssid}
                secondary={
                    props.connected
                        ? "Connected"
                        : props.secure
                          ? "Secured"
                          : "Unsecured"
                }
                style={{ width: "200px" }}
            />
            {props.connected ? (
                <>
                    {/* <Button
                        variant='contained'
                        style={{
                            color: "white",
                            marginRight: "20px",
                            fontWeight: "bold",
                        }}
                    >
                        Forget
                    </Button> */}
                    <Button
                        variant='contained'
                        style={{ color: "white", fontWeight: "bold" }}
                        onClick={() => {
                            props.on_disconnect
                                ? props.on_disconnect()
                                : undefined;
                        }}
                    >
                        Disconnect
                    </Button>
                </>
            ) : (
                <Button
                    variant='contained'
                    style={{ color: "white", fontWeight: "bold" }}
                    onClick={() => {
                        props.on_connect ? props.on_connect() : undefined;
                    }}
                >
                    Connect
                </Button>
            )}
        </ListItem>
    );
};

export interface WifiConnectDialogProps {
    ssid: string;
    secure: boolean;
    dialogOpen: boolean;
    setDialogOpen: (dialogOpen: boolean) => void;
    on_connect: (password: string) => void;
}

const WifiConnectDialog: React.FC<WifiConnectDialogProps> = (props) => {
    const [password, setPassword] = useState("");

    return (
        <Dialog open={props.dialogOpen}>
            <DialogTitle
                sx={{
                    backgroundColor: "background.paper",
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                Connect to {props.ssid}
            </DialogTitle>
            <DialogContent
                sx={{
                    backgroundColor: "background.paper",
                    paddingBottom: "0px",
                }}
            >
                {props.secure ? (
                    <TextField
                        label='Enter password'
                        variant='outlined'
                        fullWidth
                        type='password'
                        sx={{
                            width: "300px",
                            marginBottom: "16px",
                        }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                ) : undefined}
            </DialogContent>
            <DialogActions
                sx={{
                    backgroundColor: "background.paper",
                    display: "flex",
                    justifyContent: "center",
                    padding: "0px 24px 24px 24px",
                    paddingBottom: "24px",
                }}
            >
                <Button
                    variant='contained'
                    style={{
                        color: "white",
                        width: "50%",
                        marginRight: "10px",
                        fontWeight: "bold",
                    }}
                    onClick={() => {
                        props.setDialogOpen(false);
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant='contained'
                    style={{
                        color: "white",
                        width: "50%",
                        fontWeight: "bold",
                    }}
                    onClick={() => {
                        props.on_connect(password);
                        setPassword("");
                    }}
                >
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export interface NetworkSettingsCardProps {
    currentSSID: string;
    setCurrentSSID: React.Dispatch<React.SetStateAction<string>>;
    setCurrentNetwork: React.Dispatch<React.SetStateAction<WifiStatus>>;

    scannedNetworks: ScannedWifiNetwork[];
    setScannedNetworks: React.Dispatch<
        React.SetStateAction<ScannedWifiNetwork[]>
    >;
}

const NetworkSettingsCard: React.FC<NetworkSettingsCardProps> = (props) => {
    const [currentNetwork, setCurrentNetwork] = useState({} as WifiStatus);
    const [currentSSID, setCurrentSSID] = useState("");
    const [scannedNetworks, setScannedNetworks] = useState(
        [] as ScannedWifiNetwork[]
    );

    const update = () => {
        getAvailableWifi().then((scannedNetworks: ScannedWifiNetwork[]) => {
            setScannedNetworks(
                scannedNetworks.sort((networkA, networkB) => {
                    let strengthA = getSignalStrength(networkA.signal_strength);
                    let strengthB = getSignalStrength(networkB.signal_strength);
                    return (
                        strengthA - strengthB ||
                        (networkA.ssid || "").localeCompare(networkB.ssid || "")
                    );
                })
            );
        });

        getWifiStatus().then((status: WifiStatus) => {
            if (currentNetwork.ssid !== status.ssid) setCurrentNetwork(status);
        });
    };

    // Initial request
    useEffect(() => {
        setInterval(() => {
            update();
        }, 1000);

        update();
        // Initial wifi status
    }, []);

    useEffect(() => {
        setCurrentSSID(currentNetwork.ssid);
    }, [currentNetwork]);

    const [connectDialog, setConnectDialog] = useState(false);
    const [connectNetwork, setConnectNetwork] = useState(
        {} as ScannedWifiNetwork
    );
    const { enqueueSnackbar } = useSnackbar();

    const handleConnect = (network: ScannedWifiNetwork) => {
        setConnectNetwork(network);
        setConnectDialog(true);
    };

    const handleDisconnect = () => {
        disconnectFromWifi(currentSSID).then(() => {
            enqueueSnackbar(
                `Successfully disconnected from network: ${currentSSID}`,
                {
                    variant: "success",
                }
            );

            // wait for new network to come in if there is one
            // TODO: just constantly check for a new network over an interval
            setTimeout(() => {
                getWifiStatus().then((status: WifiStatus) => {
                    setCurrentNetwork(status);

                    enqueueSnackbar(
                        `Successfully connected to network: ${status.ssid}`,
                        {
                            variant: "success",
                        }
                    );
                });
            }, 5000);
        });
    };

    return (
        <Card
            sx={{
                minWidth: 512,
                boxShadow: 3,
                textAlign: "left",
                margin: "20px",
                padding: "15px",
            }}
        >
            <WifiConnectDialog
                ssid={connectNetwork.ssid || ""}
                secure={connectNetwork.secure}
                dialogOpen={connectDialog}
                setDialogOpen={setConnectDialog}
                on_connect={(password) => {
                    connectToWifi(connectNetwork.ssid || "", password).then(
                        (success) => {
                            if (success) {
                                setCurrentSSID(connectNetwork.ssid || "");
                                enqueueSnackbar(
                                    `WiFi Network: "${connectNetwork.ssid}" connected successfully`,
                                    {
                                        variant: "success",
                                    }
                                );
                            } else {
                                enqueueSnackbar(
                                    `WiFi Network: "${connectNetwork.ssid}" failed to connect`,
                                    {
                                        variant: "error",
                                    }
                                );
                            }
                        }
                    );
                    setConnectDialog(false);
                }}
            />

            <CardHeader
                title={"Network Settings"}
                sx={{ paddingBottom: "0px" }}
            />

            <List dense={true}>
                <WifiListItem
                    ssid={currentSSID}
                    signal_strength={-60} // signal strength not given by current network
                    connected={true}
                    on_disconnect={() => {
                        handleDisconnect();
                    }}
                />
            </List>

            <Accordion
                defaultExpanded={false}
                style={{
                    width: "100%",
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls='panel2a-content'
                    id='panel2a-header'
                >
                    <Typography fontWeight='800'>Available Networks</Typography>
                </AccordionSummary>
                <Box
                    sx={{
                        backgroundColor: "background.paper",
                    }}
                >
                    <List
                        dense={true}
                        style={{ maxHeight: 300, overflow: "auto" }}
                    >
                        {scannedNetworks
                            .sort(
                                (a, b) => b.signal_strength - a.signal_strength
                            )
                            .filter(
                                (network, index) =>
                                    scannedNetworks.findIndex(
                                        (findNetwork) =>
                                            network.ssid === findNetwork.ssid
                                    ) === index
                            ) // filter out duplicates
                            .filter((network) => network.ssid !== currentSSID) // filter out current network
                            .map((scanned_network) => {
                                if (!scanned_network.ssid) return;
                                else {
                                    return (
                                        <WifiListItem
                                            ssid={scanned_network.ssid}
                                            signal_strength={
                                                scanned_network.signal_strength
                                            }
                                            secure={scanned_network.secure}
                                            connected={false}
                                            on_connect={() =>
                                                handleConnect(scanned_network)
                                            }
                                        />
                                    );
                                }
                            })}
                    </List>
                </Box>
            </Accordion>
        </Card>
    );
};

export default NetworkSettingsCard;
