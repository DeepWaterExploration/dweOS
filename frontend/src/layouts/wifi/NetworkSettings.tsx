import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SignalWifi0BarIcon from "@mui/icons-material/SignalWifi0Bar";
import SignalWifi1BarIcon from "@mui/icons-material/SignalWifi1Bar";
import SignalWifi1BarLockIcon from "@mui/icons-material/SignalWifi1BarLock";
import SignalWifi2BarIcon from "@mui/icons-material/SignalWifi2Bar";
import SignalWifi2BarLockIcon from "@mui/icons-material/SignalWifi2BarLock";
import SignalWifi3BarIcon from "@mui/icons-material/SignalWifi3Bar";
import SignalWifi3BarLockIcon from "@mui/icons-material/SignalWifi3BarLock";
import SignalWifi4BarIcon from "@mui/icons-material/SignalWifi4Bar";
import SignalWifi4BarLockIcon from "@mui/icons-material/SignalWifi4BarLock";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  FormGroup,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useState } from "react";

import { connectToWifi, toggleWifiStatus } from "./api";
import { ConnectToWifiResponse, WiFiNetwork } from "./types";


export interface DBMToSignalIconProps {
  /* the signal strength in dBm */
  signalStrength: number;
  /* whether the network is secure or not */
  secure: boolean;
}

const DBMToSignalIcon: React.FC<DBMToSignalIconProps> = (props) => {
  const signalStrength = props.signalStrength;
  if (signalStrength >= -50) {
    // wifi signal is excellent
    return props.secure ? (
      <SignalWifi4BarLockIcon sx={{ fontSize: 22.5, mx: 0.5 }} />
    ) : (
      <SignalWifi4BarIcon sx={{ fontSize: 22.5, mx: 0.5 }} />
    );
  } else if (signalStrength >= -60) {
    // wifi signal is great
    return props.secure ? (
      <SignalWifi3BarLockIcon sx={{ fontSize: 22.5, mx: 0.5 }} />
    ) : (
      <SignalWifi3BarIcon sx={{ fontSize: 22.5, mx: 0.5 }} />
    );
  } else if (signalStrength >= -70) {
    // wifi signal is okay
    return props.secure ? (
      <SignalWifi2BarLockIcon sx={{ fontSize: 22.5, mx: 0.5 }} />
    ) : (
      <SignalWifi2BarIcon sx={{ fontSize: 22.5, mx: 0.5 }} />
    );
  } else if (signalStrength >= -80) {
    // wifi signal is weak
    return props.secure ? (
      <SignalWifi1BarLockIcon sx={{ fontSize: 22.5, mx: 0.5 }} />
    ) : (
      <SignalWifi1BarIcon sx={{ fontSize: 22.5, mx: 0.5 }} />
    );
  } else {
    // wifi signal is unusuable
    return <SignalWifi0BarIcon sx={{ fontSize: 22.5, mx: 0.5 }} />;
  }
};

export interface NetworkSettingsCardProps {
  wifiStatus: boolean;
  setWifiStatus: (newValue: boolean) => void;
  connectedNetwork: WiFiNetwork | null;
  setConnectedNetwork: (newValue: WiFiNetwork) => void;
  availableNetworks: WiFiNetwork[];
  setAvailableNetworks: (newValue: WiFiNetwork[]) => void;
}

const NetworkSettingsCard: React.FC<NetworkSettingsCardProps> = (props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [connectingSSID, setConnectingSSID] = useState<string>("");
  const [connectingPassword, setConnectingPassword] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<WiFiNetwork | null>(
    null
  );
  const [wifiConnectionError, setWifiConnectionError] = useState<string>("");
  const handleOpenDialogue = () => {
    setDialogOpen(true);
  };

  const handleCloseDialogue = () => {
    setConnectingPassword("");
    setDialogOpen(false);
  };

  // Handler function to toggle the Switch value
  const handleChange = async () => {
    props.setWifiStatus(await toggleWifiStatus(!props.wifiStatus));
  };

  const handleConnect = async () => {
    if (connectingPassword !== "") {
      setWifiConnectionError("");
      const result: ConnectToWifiResponse = await connectToWifi(
        connectingSSID!,
        connectingPassword
      );
      if (result.status === "success" && selectedNetwork !== null) {
        setDialogOpen(false);
        props.setConnectedNetwork(selectedNetwork);
      } else {
        setWifiConnectionError(result.message);
      }
    } else {
      setWifiConnectionError("Password cannot be empty");
    }
  };

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
      <Dialog open={dialogOpen} onClose={handleCloseDialogue}>
        <DialogTitle sx={{ backgroundColor: "background.paper", paddingBottom: "0px" }}>
          {connectingSSID}
        </DialogTitle>
        <DialogContent
          sx={{ backgroundColor: "background.paper", paddingBottom: "0px" }}
        >
          {/* Wifi Password Input */}
          <TextField
            label='Enter password'
            variant='outlined'
            fullWidth
            value={connectingPassword}
            onChange={(e) => setConnectingPassword(e.target.value)}
            error={!!wifiConnectionError}
            helperText={wifiConnectionError}
            type='password'
            sx={{ width: "300px", margin: "16px 0px" }}
          />
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: "background.paper",
            display: "flex",
            justifyContent: "left",
            padding: "0px 24px 24px 24px",
            paddingBottom: "24px",
          }}
        >
          <Button
            variant='contained'
            style={{
              color: "white",
              marginRight: "10px",
              fontWeight: "bold",
            }}
            onClick={handleCloseDialogue}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            style={{
              color: "white",
              fontWeight: "bold",
            }}
            onClick={handleConnect}
          >
            Connect
          </Button>
        </DialogActions>
      </Dialog>
      <CardHeader
        // action={deviceWarning}
        title={"Network Settings"}
        sx={{ paddingBottom: "0px" }}
      />
      <CardContent>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                disabled={true}
                checked={props.wifiStatus}
                onChange={handleChange}
                color='primary' // Set the color you want for the Switch
              />
            }
            label='Wi-Fi'
          />
        </FormGroup>
        {props.wifiStatus == true ? (
          <>
            <Box
              sx={{
                backgroundColor: "background.paper",
                margin: "16px",
              }}
            >
              <List dense={true}>
                <ListItem>
                  {props.connectedNetwork !== null ? (
                    <ListItemAvatar>
                      <Avatar>
                        <DBMToSignalIcon
                          signalStrength={
                            props.connectedNetwork.signal_strength
                          }
                          secure={props.connectedNetwork.secure}
                        />
                      </Avatar>
                    </ListItemAvatar>
                  ) : (
                    <ListItemAvatar>
                      <Avatar>
                        <SignalWifi0BarIcon sx={{ fontSize: 22.5, mx: 0.5 }} />
                      </Avatar>
                    </ListItemAvatar>
                  )}
                  <ListItemText
                    primary={props.connectedNetwork?.ssid ?? "Not Connected"}
                    secondary={
                      `${props.connectedNetwork?.signal_strength} dBm` ?? "N/A"
                    }
                    style={{ width: "200px" }}
                  />
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
                </ListItem>
              </List>
            </Box>
            <Accordion
              style={{
                width: "100%",
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls='panel2a-content'
                id='panel2a-header'
              >
                <Typography fontWeight='800'>
                  Show available networks
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box
                  sx={{
                    backgroundColor: "background.paper",
                  }}
                >
                  {!props.wifiStatus || props.availableNetworks == null ? (
                    <Typography
                      fontWeight='500'
                      style={{
                        width: "100%",
                        textAlign: "center",
                        padding: "25px",
                      }}
                    >
                      No stream endpoint added
                    </Typography>
                  ) : (
                    <List dense={true} style={{ maxHeight: 300, overflow: "auto" }}>
                      {props.availableNetworks !== null &&
                        props.availableNetworks.map((network: WiFiNetwork) => {
                          if (network.ssid === props.connectedNetwork?.ssid) {
                            return null;
                          } else {
                            return (
                              <ListItem
                                style={{
                                  margin: "10px 0px",
                                }}
                                key={`${network.ssid}`}
                                secondaryAction={
                                  <Button
                                    variant='contained'
                                    style={{
                                      color: "white",
                                      marginRight: "16px",
                                      fontWeight: "bold",
                                    }}
                                    onClick={() => {
                                      setConnectingSSID(network.ssid);
                                      setSelectedNetwork(network);
                                      setWifiConnectionError("");
                                      handleOpenDialogue();
                                    }}
                                  >
                                    Connect
                                  </Button>
                                }
                              >
                                <ListItemAvatar>
                                  <Avatar>
                                    <DBMToSignalIcon
                                      signalStrength={network.signal_strength}
                                      secure={network.secure}
                                    />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={network.ssid}
                                  secondary={
                                    network.secure ? "Secured" : "Unsecured"
                                  }
                                />
                              </ListItem>
                            );
                          }
                        })}
                    </List>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          </>
        ) : (
          <></>
        )}
      </CardContent>
    </Card>
  );
};

export default NetworkSettingsCard;
