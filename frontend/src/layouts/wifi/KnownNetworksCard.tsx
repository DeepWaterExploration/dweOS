import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Divider,
    List,
    Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { styles } from "../../style";
import { Connection } from "./types";
import { forgetNetwork, getConnections } from "./api";
import WifiListItem, { WifiListItemType } from "./WifiListItem";

const KnownNetworksCard = ({}) => {
    const [knownNetworks, setKnownNetworks] = useState([] as Connection[]);

    const refreshNetworks = () => {
        getConnections().then(setKnownNetworks);
    };

    useEffect(() => {
        const interval = setInterval(() => refreshNetworks(), 500);
        return () => {
            clearInterval(interval);
            console.log("clearing interval");
        };
    }, []);

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
                                        forgetNetwork(connection.id)
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
