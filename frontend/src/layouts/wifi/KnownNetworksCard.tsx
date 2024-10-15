import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";

import React, { useEffect, useState } from "react";
import { styles } from "../../style";
import { Connection } from "./types";
import { forgetNetwork, getConnections } from "./api";
import WifiListItem, { WifiListItemType } from "./WifiListItem";
import { useSnackbar } from "notistack";

const KnownNetworksCard = ({}) => {
    const [knownNetworks, setKnownNetworks] = useState([] as Connection[]);
    const { enqueueSnackbar } = useSnackbar();

    const refreshNetworks = () => {
        getConnections().then(setKnownNetworks);
    };

    useEffect(() => {
        refreshNetworks();
        const interval = setInterval(() => refreshNetworks(), 500);
        return () => {
            clearInterval(interval);
        };
    }, []);

    const onForgetNetwork = async (ssid: string) => {
        await forgetNetwork(ssid);
        setTimeout(async () => {
            let newNetworks = await getConnections();
            if (newNetworks.find((connection) => connection.id === ssid))
                enqueueSnackbar("Failed to forget network", {
                    variant: "error",
                });
            else
                enqueueSnackbar("Successfully forgot network!", {
                    variant: "success",
                });
        }, 250);
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
