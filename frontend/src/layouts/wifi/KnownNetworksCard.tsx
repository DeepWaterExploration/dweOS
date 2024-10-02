import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Divider,
    List,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { styles } from "../../style";
import { Connection } from "./types";
import { getConnections } from "./api";
import WifiListItem, { WifiListItemType } from "./WifiListItem";

const KnownNetworksCard = ({}) => {
    const [knownNetworks, setKnownNetworks] = useState([] as Connection[]);

    useEffect(() => {
        getConnections().then(setKnownNetworks);
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
                        {knownNetworks.map((connection, index) => (
                            <WifiListItem
                                ssid={connection.id}
                                key={index}
                                signal_strength={100}
                                type={WifiListItemType.KNOWN}
                            />
                        ))}
                    </List>
                </Box>
            </CardContent>
        </Card>
    );
};

export default KnownNetworksCard;
