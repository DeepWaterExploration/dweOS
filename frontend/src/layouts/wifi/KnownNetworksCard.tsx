import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";

import React, { useContext, useEffect, useState } from "react";
import { styles } from "../../style";
import { Connection } from "./types";
import { connectToNetwork, forgetNetwork, getConnections } from "./api";
import WifiListItem, { WifiListItemType } from "./WifiListItem";
import { useSnackbar } from "notistack";
import WebsocketContext from "../../contexts/WebsocketContext";

export interface KnownNetworksCardProps {
    currentNetwork: Connection;
    setCurrentNetwork: React.Dispatch<React.SetStateAction<Connection>>;
}

const KnownNetworksCard: React.FC<KnownNetworksCardProps> = ({
    currentNetwork,
    setCurrentNetwork,
}) => {
    const { connected, socket } = useContext(WebsocketContext);

    const [knownNetworks, setKnownNetworks] = useState([] as Connection[]);
    const { enqueueSnackbar } = useSnackbar();

    const refreshNetworks = () => {
        getConnections().then(setKnownNetworks);
    };

    useEffect(() => {
        if (connected) {
            refreshNetworks();
            socket.on("connections_changed", refreshNetworks);
            return () => {
                socket.off("connections_changed");
            };
        }
    }, [connected]);

    const onForgetNetwork = async (ssid: string) => {
        let result = await forgetNetwork(ssid);
        if (result) {
            enqueueSnackbar("Successfully forgot network!", {
                variant: "success",
            });
            setKnownNetworks((prevKnownNetworks) =>
                prevKnownNetworks.filter((connection) => connection.id !== ssid)
            );

            if (currentNetwork.id === ssid) {
                setCurrentNetwork({
                    id: "",
                    type: "",
                });
            }
        } else {
            enqueueSnackbar("Failed to forget network", {
                variant: "error",
            });
        }
    };

    const onConnectToNetwork = async (ssid: string) => {
        let result = await connectToNetwork(ssid);
        if (result) {
            enqueueSnackbar("Successfully connected to network!", {
                variant: "success",
            });
            setCurrentNetwork({
                id: ssid,
                type: "802-11-wireless",
            });
        } else {
            enqueueSnackbar("Failed to connected to network", {
                variant: "error",
            });
        }
    };

    return (
        <Card sx={{ ...styles.card, maxHeight: 450 }}>
            <CardHeader
                title={"Known Networks"}
                sx={{ paddingBottom: "0px" }}
            />
            <CardContent>
                <Box>
                    <Divider />
                    <List
                        dense={true}
                        style={{ maxHeight: 300, overflow: "auto" }}
                    >
                        {knownNetworks.length > 0 ? (
                            knownNetworks.map((connection, index) => (
                                <WifiListItem
                                    ssid={connection.id}
                                    key={index}
                                    signal_strength={100}
                                    type={WifiListItemType.KNOWN}
                                    on_forget={() =>
                                        onForgetNetwork(connection.id)
                                    }
                                    on_connect={() =>
                                        onConnectToNetwork(connection.id)
                                    }
                                />
                            ))
                        ) : (
                            <Typography>No known networks.</Typography>
                        )}
                    </List>
                </Box>
            </CardContent>
        </Card>
    );
};

export default KnownNetworksCard;
