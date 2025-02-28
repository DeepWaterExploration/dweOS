import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import TextField from "@mui/material/TextField";

import { AccessPoint, Connection } from "./types";
import { useContext, useEffect, useState } from "react";
import {
    connectToNetwork,
    disconnectFromNetwork,
    getAccessPoints,
    getWiFiStatus,
} from "./api";
import { useSnackbar } from "notistack";
import React from "react";
import { styles } from "../../style";
import { hash } from "../../utils/utils";
import WifiListItem, { WifiListItemType } from "./WifiListItem";
import WebsocketContext from "../../contexts/WebsocketContext";

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
    loadingText: string;
    setLoadingText: React.Dispatch<React.SetStateAction<string>>;
}

const NetworkSettingsCard: React.FC<NetworkSettingsCardProps> = ({
    setCurrentNetwork,
    currentNetwork,
    setLoadingText,
}) => {
    const { connected, socket } = useContext(WebsocketContext);

    const [wifiConnected, setConnected] = useState(false);
    const [finishedFirstScan, setFinishedFirstScan] = useState(false);
    const [accessPoints, setAccessPoints] = useState([] as AccessPoint[]);
    const { enqueueSnackbar } = useSnackbar();

    const refreshNetworks = async () => {
        let status = await getWiFiStatus();
        let newAccessPoints = await getAccessPoints();

        setFinishedFirstScan(status.finished_first_scan);
        setConnected(status.connected);
        setCurrentNetwork(status.connection);
        setAccessPoints(newAccessPoints);

        return {
            newNetwork: status.connection,
            newAccessPoints,
        };
    };

    // Initial request
    useEffect(() => {
        if (connected) {
            refreshNetworks();

            socket.on("wifi_disconnected", () => {
                setConnected(false);
                setCurrentNetwork({
                    id: "",
                    type: "",
                });
            });
            return () => {
                socket.off("wifi_disconnected");
            };
        }
    }, [connected]);

    const [connectDialog, setConnectDialog] = useState(false);
    const [connectNetwork, setConnectNetwork] = useState(
        undefined as AccessPoint | undefined
    );

    const onConnectToNewNetwork = async (ssid: string, password?: string) => {
        setLoadingText(`Connecting to network ${ssid}...`);
        let result = await connectToNetwork(ssid, password);
        setLoadingText("");
        if (result) {
            enqueueSnackbar("Connection Successful!", {
                variant: "success",
            });
            setConnected(true);
            setCurrentNetwork({ id: ssid, type: "802-11-wireless" });
        } else {
            enqueueSnackbar("Connection failed", { variant: "error" });
        }
    };

    const onDisconnectFromNetwork = async () => {
        setLoadingText("Disconnecing from network...");
        let result = await disconnectFromNetwork();
        setLoadingText("");
        if (result) {
            enqueueSnackbar("Disconnection Successful!", {
                variant: "success",
            });
            setConnected(false);
            setCurrentNetwork({ id: "", type: "" });
        } else {
            enqueueSnackbar(
                <>
                    {"Disconnection failed, check"}
                    <a href='/communications/logs'>&nbsp;logs&nbsp;</a>
                    {"for more information"}
                </>,
                { variant: "error" }
            );
        }
    };

    return (
        <Card
            sx={{
                ...styles.card,
                position: "relative",
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
            <CardContent>
                <Divider />
                <Box>
                    <List
                        dense={true}
                        style={{ maxHeight: 300, overflow: "auto" }}
                    >
                        {currentNetwork.id && currentNetwork.type && (
                            <WifiListItem
                                ssid={currentNetwork.id}
                                signal_strength={100} // signal strength not given by current network
                                type={WifiListItemType.CONNECTED}
                                on_disconnect={() => {
                                    onDisconnectFromNetwork();
                                }}
                            />
                        )}
                        {/* Display a loading circle when waiting for the first scan to complete */}
                        {accessPoints.length === 0 && !finishedFirstScan && (
                            <Box
                                display='flex'
                                justifyContent='center'
                                alignItems='center'
                            >
                                <CircularProgress />
                            </Box>
                        )}
                        {accessPoints
                            .sort(
                                (a, b) =>
                                    b.strength - a.strength ||
                                    hash(a.ssid) - hash(b.ssid)
                            )
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
                                            type={WifiListItemType.DISCONNECTED}
                                            on_connect={() => {
                                                setConnectNetwork(
                                                    scanned_network
                                                );
                                                setConnectDialog(true);
                                            }}
                                        />
                                    );
                                }
                            })}
                    </List>
                </Box>
            </CardContent>
        </Card>
    );
};

export default NetworkSettingsCard;
