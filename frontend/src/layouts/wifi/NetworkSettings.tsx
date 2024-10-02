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
    Divider,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    TextField,
    Typography,
} from "@mui/material";

import {
    SignalWifi0Bar,
    SignalWifi1Bar,
    SignalWifi2Bar,
    SignalWifi3Bar,
    SignalWifi4Bar,
} from "@mui/icons-material";
import { AccessPoint, Connection } from "./types";
import { useEffect, useState } from "react";
import {
    connectToNetwork,
    disconnectFromNetwork,
    getAccessPoints,
    getWiFiStatus,
} from "./api";
import { useSnackbar } from "notistack";
import React from "react";

export interface SignalIconProps {
    signal_strength: number;
}

const thresholds = [100, 70, 50, 20];

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
                <Button
                    variant='contained'
                    style={{ color: "white", fontWeight: "bold" }}
                    onClick={() => {
                        props.on_disconnect ? props.on_disconnect() : undefined;
                    }}
                >
                    Disconnect
                </Button>
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
    currentNetwork: Connection;
    setCurrentNetwork: React.Dispatch<React.SetStateAction<Connection>>;
    accessPoints: AccessPoint[];
}

const NetworkSettingsCard: React.FC<NetworkSettingsCardProps> = ({
    currentNetwork,
    accessPoints,
    setCurrentNetwork,
}) => {
    const [connectDialog, setConnectDialog] = useState(false);
    const [connectNetwork, setConnectNetwork] = useState(
        undefined as AccessPoint | undefined
    );

    const onConnectToNewNetwork = (ssid: string, password?: string) => {
        connectToNetwork(ssid, password).then(() => {
            // TODO: check if the connection was successful
            setCurrentNetwork({ id: ssid, type: "" });
        });
    };

    const onDisconnectFromNetwork = () => {
        setCurrentNetwork(undefined);
        disconnectFromNetwork();
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
            {connectNetwork && (
                <WifiConnectDialog
                    ssid={connectNetwork.ssid}
                    secure={connectNetwork.requires_password}
                    dialogOpen={connectDialog}
                    setDialogOpen={setConnectDialog}
                    on_connect={(password) => {
                        onConnectToNewNetwork(connectNetwork.ssid, password);
                        setConnectDialog(false);
                        setConnectNetwork(undefined);
                    }}
                />
            )}

            <CardHeader
                title={"Network Settings"}
                sx={{ paddingBottom: "0px" }}
            />

            <List dense={true}></List>

            <Divider />

            <Box
                sx={{
                    backgroundColor: "background.paper",
                }}
            >
                <List dense={true} style={{ maxHeight: 300, overflow: "auto" }}>
                    {currentNetwork && (
                        <WifiListItem
                            ssid={currentNetwork.id}
                            signal_strength={100} // signal strength not given by current network
                            connected={true}
                            on_disconnect={() => {
                                onDisconnectFromNetwork();
                            }}
                        />
                    )}
                    {accessPoints
                        .sort((a, b) => b.strength - a.strength)
                        .filter(
                            (network, index) =>
                                accessPoints.findIndex(
                                    (findNetwork) =>
                                        network.ssid === findNetwork.ssid
                                ) === index
                        ) // filter out duplicates
                        .filter((network) =>
                            currentNetwork
                                ? network.ssid !== currentNetwork.id
                                : true
                        ) // filter out current network
                        .map((scanned_network) => {
                            if (!scanned_network.ssid) return;
                            else {
                                return (
                                    <WifiListItem
                                        key={scanned_network.ssid}
                                        ssid={scanned_network.ssid}
                                        signal_strength={
                                            scanned_network.strength
                                        }
                                        secure={
                                            scanned_network.requires_password
                                        }
                                        connected={false}
                                        on_connect={() => {
                                            setConnectNetwork(scanned_network);
                                            setConnectDialog(true);
                                        }}
                                    />
                                );
                            }
                        })}
                </List>
            </Box>
        </Card>
    );
};

export default NetworkSettingsCard;
