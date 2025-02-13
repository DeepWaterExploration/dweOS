import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import OutlinedInput from "@mui/material/OutlinedInput";

import React, { useContext, useEffect, useState } from "react";
import { styles } from "../../style";
import WebsocketContext from "../../contexts/WebsocketContext";

enum ConnectionType {
    ETHERNET = 0,
    WIRELESS = 1,
    AUTO = 2,
}

const IPConfigurationCard = ({}) => {
    const { connected } = useContext(WebsocketContext);

    const [networkInfo, setNetworkInfo] = useState({
        currentIP: "192.168.2.100",
        connectionType: ConnectionType.ETHERNET,
        dhcpEnabled: false,
    });

    const [staticIP, setStaticIP] = useState(networkInfo.currentIP),
        [subnet, setSubnet] = useState("255.255.255.0"),
        [gateway, setGateway] = useState("192.168.2.1"),
        [dns, setDNS] = useState("8.8.8.8");
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("");

    const handleDHCPChange = () => {
        setLoading(true);
        if (networkInfo.dhcpEnabled)
            setLoadingText("Switching to Static IP Address...");
        else setLoadingText("Switching to DHCP...");

        setTimeout(() => {
            setNetworkInfo((prev) => ({
                ...prev,
                currentIP: !prev.dhcpEnabled
                    ? `192.168.2.${Math.floor(Math.random() * 255)}`
                    : staticIP,
                dhcpEnabled: !prev.dhcpEnabled,
            }));
            setLoading(false);
        }, 2000);
    };

    const handleUpdate = () => {
        setLoading(true);
        setLoadingText("Updating IP Configuration...");

        setTimeout(() => {
            setNetworkInfo((prev) => ({
                ...prev,
                currentIP: staticIP,
            }));
            setLoading(false);
        }, 2000);
    };

    useEffect(() => {
        if (connected) {
            // Stuff to do on connected
        }
    }, [connected]);

    return (
        <Card sx={{ ...styles.card }}>
            <Backdrop open={loading} sx={{ zIndex: 10, color: "#fff" }}>
                <Box display='flex' flexDirection='column' alignItems='center'>
                    <CircularProgress color='inherit' />
                    <Box mt={2}>{loadingText}</Box>
                </Box>
            </Backdrop>
            <CardHeader
                title={"IP Configuration"}
                sx={{ paddingBottom: "0px" }}
            />
            <CardContent>
                <Box>
                    <Divider />

                    <Box sx={{ mb: 2, mt: 1 }}>
                        <strong>Current IP:</strong> {networkInfo.currentIP}{" "}
                        <br />
                        <strong>Connection Type:</strong>{" "}
                        {ConnectionType[networkInfo.connectionType]} <br />
                        <strong>DHCP Enabled:</strong>{" "}
                        {networkInfo.dhcpEnabled ? "Yes" : "No"}
                    </Box>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Connection Priority</InputLabel>
                        <Select
                            defaultValue={"auto"}
                            input={
                                <OutlinedInput
                                    notched
                                    label={"Connection Priority"}
                                />
                            }
                            onChange={handleUpdate}
                        >
                            <MenuItem value='auto'>
                                Auto (Best Network)
                            </MenuItem>
                            <MenuItem value='wifi'>WiFi</MenuItem>
                            <MenuItem value='ethernet'>Ethernet</MenuItem>
                        </Select>
                    </FormControl>

                    {/* DHCP Toggle */}
                    <Box display='flex' alignItems='center' sx={{ mb: 2 }}>
                        <Switch
                            checked={!networkInfo.dhcpEnabled}
                            onChange={handleDHCPChange}
                        />
                        <span>Use Static IP</span>
                    </Box>

                    {/* Static IP Configuration */}
                    {!networkInfo.dhcpEnabled && (
                        <Box>
                            <TextField
                                fullWidth
                                label='Static IP'
                                value={staticIP}
                                onChange={(e) => setStaticIP(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label='Subnet Mask'
                                value={subnet}
                                onChange={(e) => setSubnet(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label='Gateway'
                                value={gateway}
                                onChange={(e) => setGateway(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label='DNS'
                                value={dns}
                                onChange={(e) => setDNS(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <Button variant='contained' onClick={handleUpdate}>
                                Update Configuration
                            </Button>
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default IPConfigurationCard;
