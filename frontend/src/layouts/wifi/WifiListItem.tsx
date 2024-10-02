import {
    Avatar,
    Button,
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
import React from "react";

export interface SignalIconProps {
    signal_strength: number;
}

export enum WifiListItemType {
    CONNECTED = 0,
    DISCONNECTED,
    KNOWN,
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
    on_connect?: () => void;
    on_disconnect?: () => void;
    secure?: boolean;
    type: WifiListItemType;
}

const WifiListItem: React.FC<WifiListItemProps> = (props) => {
    return (
        <ListItem>
            <WifiSignalAvatar signal_strength={props.signal_strength} />
            <ListItemText
                primary={props.ssid}
                secondary={
                    props.type === WifiListItemType.CONNECTED
                        ? "Connected"
                        : props.secure
                          ? "Secured"
                          : "Unsecured"
                }
                style={{ width: "200px" }}
            />
            {(() => {
                switch (props.type) {
                    case WifiListItemType.CONNECTED:
                        return (
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
                        );
                    case WifiListItemType.DISCONNECTED:
                        return (
                            <Button
                                variant='contained'
                                style={{ color: "white", fontWeight: "bold" }}
                                onClick={() => {
                                    props.on_connect
                                        ? props.on_connect()
                                        : undefined;
                                }}
                            >
                                Connect
                            </Button>
                        );
                    case WifiListItemType.KNOWN:
                        return (
                            <Button
                                variant='contained'
                                style={{ color: "white", fontWeight: "bold" }}
                                onClick={() => {
                                    props.on_connect
                                        ? props.on_connect()
                                        : undefined;
                                }}
                            >
                                Forget
                            </Button>
                        );
                }
                return <></>;
            })()}
        </ListItem>
    );
};

export default WifiListItem;
