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
import {
    getIPConfiguration,
    getNetworkPriority,
    setIPConfiguration,
    setNetworkPriority,
} from "./api";
import { IPConfiguration, IPType, NetworkPriority } from "./types";
import { useDidMountEffect } from "../../utils/utils";
import { enqueueSnackbar } from "notistack";

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

    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("");
    const [firstLoad, setFirstLoad] = useState(true);

    const [isDirty, setIsDirty] = useState(false);

    const [staticIP, setStaticIP] = useState("192.168.2.100");
    const [gateway, setGateway] = useState("0.0.0.0");
    const [subnet, setSubnet] = useState("255.255.255.0");
    const [dns, setDNS] = useState([]);
    const [dnsInput, setDNSInput] = useState("");

    const [staticIpError, setStaticIpError] = useState(false);
    const [gatewayError, setGatewayError] = useState(false);
    const [subnetError, setSubnetError] = useState(false);
    const [dnsError, setDnsError] = useState(false);
    const [networkPriorityInfo, setNetworkPriorityInfo] = useState(
        NetworkPriority.ETHERNET
    );

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
        if (isError()) {
            enqueueSnackbar(
                "Please fix the highlighted errors before updating.",
                { variant: "error" }
            );
            return;
        }
        setLoading(true);
        setLoadingText("Updating IP Configuration...");

        const newIpConfig: IPConfiguration = {
            static_ip: staticIP,
            gateway: gateway,
            prefix: netmaskToCidr(subnet),
            ip_type: dhcpEnabled ? IPType.DYNAMIC : IPType.STATIC,
            dns: dns,
        };
        console.log(newIpConfig);
        setIPConfiguration(newIpConfig).then(() => {
            setLoading(false);
        });
        setIPConfigurationInfo(newIpConfig);
    };

    const isValidIP = (ip: string) => {
        return (
            /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) &&
            ip.split(".").every((octet) => parseInt(octet) <= 255)
        );
    };

    const handleStaticIpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.trim();
        setStaticIP(value);
        if (value && !isValidIP(value)) {
            setStaticIpError(true);
        } else {
            setStaticIpError(false);
        }
    };

    const handleSubnetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.trim();
        setSubnet(value);
        if (value && !isValidIP(value)) {
            setSubnetError(true);
        } else {
            setSubnetError(false);
        }
    };

    const handleGatewayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.trim();
        setGateway(value);
        if (value && !isValidIP(value)) {
            setGatewayError(true);
        } else {
            setGatewayError(false);
        }
    };

    const handleDnsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDNSInput(e.target.value);

        const newDnsArray = e.target.value
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item);

        // Validate each IP
        const isValid = newDnsArray.every(isValidIP);

        if (isValid || newDnsArray.length === 0) {
            setDNS(newDnsArray);
        }

        setDnsError(validateInput(e.target.value));
    };

    useEffect(() => {
        if (connected) {
            // Stuff to do on connected
            getIPConfiguration().then((ip_configuration) => {
                setIPConfigurationInfo(ip_configuration);
                setFirstLoad(false);
            });

            getNetworkPriority().then((priority) =>
                setNetworkPriorityInfo(priority.network_priority)
            );
        }
    }, [connected]);

    const isError = () =>
        staticIpError || dnsError || subnetError || gatewayError;

    useEffect(() => {
        if (ipConfiguration) {
            if (
                ipConfiguration.static_ip !== staticIP ||
                !(
                    ipConfiguration.gateway === gateway ||
                    (ipConfiguration.gateway === null && gateway === "0.0.0.0")
                ) ||
                ipConfiguration.prefix !== netmaskToCidr(subnet) ||
                (ipConfiguration.dns != dns && !isError())
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
            console.log(ipConfiguration.dns);
            setDNS(ipConfiguration.dns || []);
            setDNSInput((ipConfiguration.dns || []).join(", "));
        }
    }, [ipConfiguration]);

    useEffect(() => {
        if (connected) {
            setLoadingText("Changing network priority");
            setLoading(true);
            setNetworkPriority(networkPriorityInfo).then(() => {
                setLoading(false);
            });
        }
    }, [networkPriorityInfo]);

    const validateInput = (input: string) =>
        input.length !== 0 &&
        input
            .split(",")
            .map((item) => item.trim())
            .some((ip) => !isValidIP(ip));

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
                                value={networkPriorityInfo}
                                input={
                                    <OutlinedInput
                                        notched
                                        label={"Connection Priority"}
                                    />
                                }
                                onChange={(e) =>
                                    setNetworkPriorityInfo(
                                        e.target.value as NetworkPriority
                                    )
                                }
                            >
                                <MenuItem value={NetworkPriority.WIRELESS}>
                                    WiFi
                                </MenuItem>
                                <MenuItem value={NetworkPriority.ETHERNET}>
                                    Ethernet
                                </MenuItem>
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
                                    onChange={handleStaticIpChange}
                                    sx={{ mb: 2 }}
                                    error={staticIpError}
                                />
                                <TextField
                                    fullWidth
                                    label='Subnet Mask'
                                    value={subnet}
                                    onChange={handleSubnetChange}
                                    sx={{ mb: 2 }}
                                    error={subnetError}
                                />
                                <TextField
                                    fullWidth
                                    label='Gateway'
                                    value={gateway}
                                    onChange={handleGatewayChange}
                                    sx={{ mb: 2 }}
                                    error={gatewayError}
                                />
                                <TextField
                                    fullWidth
                                    label='DNS (comma-separated)'
                                    value={dnsInput}
                                    onChange={handleDnsChange}
                                    helperText={
                                        dnsError
                                            ? "Invalid IP address format"
                                            : ""
                                    }
                                    error={dnsError}
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
