import {
    Avatar,
    Button,
    Card,
    CardHeader,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
} from "@mui/material";

import {
    SignalWifi0Bar,
    SignalWifi1Bar,
    SignalWifi2Bar,
    SignalWifi3Bar,
    SignalWifi4Bar,
} from "@mui/icons-material";
import { WifiStatus, ScannedWifiNetwork } from "./types";

export interface SignalIconProps {
    signal_strength: number;
}

const SignalIcon: React.FC<SignalIconProps> = (props) => {
    // Define the signal strength thresholds for each bar
    const thresholds = [-60, -70, -80, -90];

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
}

const WifiListItem: React.FC<WifiListItemProps> = (props) => {
    return (
        <ListItem>
            <WifiSignalAvatar signal_strength={props.signal_strength} />
            <ListItemText
                primary={props.ssid}
                secondary={"Connected"}
                style={{ width: "200px" }}
            />
            {props.connected ? (
                <>
                    <Button
                        variant='contained'
                        style={{
                            color: "white",
                            marginRight: "20px",
                            fontWeight: "bold",
                        }}
                    >
                        Forget
                    </Button>
                    <Button
                        variant='contained'
                        style={{ color: "white", fontWeight: "bold" }}
                    >
                        Disconnect
                    </Button>
                </>
            ) : (
                <Button
                    variant='contained'
                    style={{ color: "white", fontWeight: "bold" }}
                >
                    Connect
                </Button>
            )}
        </ListItem>
    );
};

export interface NetworkSettingsCardProps {
    currentNetwork: WifiStatus;
    setCurrentNetwork: React.Dispatch<React.SetStateAction<WifiStatus>>;

    scannedNetworks: ScannedWifiNetwork[];
    setScannedNetworks: React.Dispatch<
        React.SetStateAction<ScannedWifiNetwork[]>
    >;
}

const NetworkSettingsCard: React.FC<NetworkSettingsCardProps> = (props) => {
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
            <CardHeader
                title={"Network Settings"}
                sx={{ paddingBottom: "0px" }}
            />

            <List dense={true}>
                <WifiListItem
                    ssid={props.currentNetwork.ssid}
                    signal_strength={-60} // signal strength not given by current network
                    connected={true}
                />
            </List>

            <List dense={true} style={{ maxHeight: 300, overflow: "auto" }}>
                {props.scannedNetworks.map((scanned_network) => {
                    if (!scanned_network.ssid) return;
                    else if (scanned_network.ssid === props.currentNetwork.ssid)
                        return null;
                    else {
                        return (
                            <WifiListItem
                                ssid={scanned_network.ssid}
                                signal_strength={
                                    scanned_network.signal_strength
                                }
                                connected={false}
                            />
                        );
                    }
                })}
            </List>
        </Card>
    );
};

export default NetworkSettingsCard;
