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
import Alert from "@mui/material/Alert";

import React, { useContext, useEffect, useState } from "react";
import { styles } from "../../style";
import WebsocketContext from "../../contexts/WebsocketContext";
import { getIPConfiguration, setIPConfiguration } from "./api";
import { IPConfiguration, IPType } from "./types";
import { useDidMountEffect } from "../../utils/utils";

enum ConnectionType {
    ETHERNET = 0,
    WIRELESS = 1,
    AUTO = 2,
}

const netmaskToCidr = (n) =>
    n.split(".").reduce((c, o) => c - Math.log2(256 - +o), 32);

function createNetmaskAddr(bitCount) {
    var mask = [],
        i,
        n;
    for (i = 0; i < 4; i++) {
        n = Math.min(bitCount, 8);
        mask.push(256 - Math.pow(2, 8 - n));
        bitCount -= n;
    }
    return mask.join(".");
}

const IPConfigurationCard = ({}) => {
    const { connected } = useContext(WebsocketContext);

    const [ipConfiguration, setIPConfigurationInfo] = useState<
        undefined | IPConfiguration
    >(null);

    const [dhcpEnabled, setDhcpEnabled] = useState(false);

    const [dns, setDNS] = useState("8.8.8.8");
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("");
    const [firstLoad, setFirstLoad] = useState(true);

    const [isDirty, setIsDirty] = useState(false);

    const [staticIP, setStaticIP] = useState("192.168.2.100");
    const [gateway, setGateway] = useState("0.0.0.0");
    const [subnet, setSubnet] = useState("255.255.255.0");

    const handleDHCPChange = () => {
        setLoading(true);
        if (dhcpEnabled) {
            setDhcpEnabled(false);
            setLoading(false);

            setStaticIP("192.168.2.100");
            setGateway("0.0.0.0");
            setSubnet("255.255.255.0");
        } else {
            updateIPConfiguration({ ip_type: IPType.DYNAMIC }).then(() =>
                setTimeout(() => {
                    stopLoading();
                }, 200)
            );
            setLoadingText("Switching to DHCP...");
        }
    };

    const stopLoading = () => {
        setDhcpEnabled(!dhcpEnabled);
        setLoading(false);
        getIPConfiguration().then(setIPConfigurationInfo);
    };

    const updateIPConfiguration = async (newConfig: IPConfiguration) => {
        setIPConfigurationInfo(newConfig);
        return await setIPConfiguration(newConfig);
    };

    const handleUpdate = () => {
        setLoading(true);
        setLoadingText("Updating IP Configuration...");

        const newIpConfig: IPConfiguration = {
            static_ip: staticIP,
            gateway: gateway,
            prefix: netmaskToCidr(subnet),
            ip_type: dhcpEnabled ? IPType.DYNAMIC : IPType.STATIC,
        };
        console.log(newIpConfig);
        setIPConfiguration(newIpConfig).then(() => {
            setLoading(false);
        });
        setIPConfigurationInfo(newIpConfig);
    };

    useEffect(() => {
        if (connected) {
            // Stuff to do on connected
            getIPConfiguration().then((ip_configuration) => {
                setIPConfigurationInfo(ip_configuration);
                setFirstLoad(false);
            });
        }
    }, [connected]);

    useEffect(() => {
        if (ipConfiguration) {
            if (
                ipConfiguration.static_ip !== staticIP ||
                !(
                    ipConfiguration.gateway === gateway ||
                    (ipConfiguration.gateway === null && gateway === "0.0.0.0")
                ) ||
                ipConfiguration.prefix !== netmaskToCidr(subnet)
            ) {
                setIsDirty(true);
            } else {
                setIsDirty(false);
            }
        }
    }, [staticIP, gateway, dns, subnet, ipConfiguration]);

    useEffect(() => {
        if (ipConfiguration) {
            setSubnet(createNetmaskAddr(ipConfiguration.prefix || 24));
            console.log(ipConfiguration.static_ip);
            setStaticIP(ipConfiguration.static_ip || "192.168.2.100");
            setDhcpEnabled(ipConfiguration.ip_type === IPType.DYNAMIC);
            setGateway(ipConfiguration.gateway || "0.0.0.0");
        }
    }, [ipConfiguration]);

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
            {ipConfiguration && (
                <CardContent>
                    <Box>
                        <Divider />

                        {/* If user has unsaved changes, show an alert */}
                        {isDirty && (
                            <Alert severity='info' sx={{ mb: 2 }}>
                                You have unsaved changes. Please click “Update
                                Configuration” to apply them.
                            </Alert>
                        )}

                        <Box sx={{ mb: 2, mt: 1 }}>
                            <strong>Current IP:</strong>{" "}
                            {ipConfiguration.static_ip} <br />
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
                                checked={!dhcpEnabled}
                                onChange={handleDHCPChange}
                            />
                            <span>Use Static IP</span>
                        </Box>

                        {/* Static IP Configuration */}
                        {!dhcpEnabled && (
                            <Box>
                                <TextField
                                    fullWidth
                                    label='Static IP'
                                    value={staticIP}
                                    onChange={(e) =>
                                        setStaticIP(e.target.value)
                                    }
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
                                <Button
                                    variant='contained'
                                    onClick={handleUpdate}
                                >
                                    Update Configuration
                                </Button>
                            </Box>
                        )}
                    </Box>
                </CardContent>
            )}
        </Card>
    );
};

export default IPConfigurationCard;
