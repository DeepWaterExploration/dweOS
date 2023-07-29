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
  Typography,
} from "@mui/material";
import { useState } from "react";

import { toggleWifiStatus } from "./api";
import { WiFiNetwork } from "./types";

export interface DBMToSignalIconProps {
  /* the signal strength in dBm */
  signalStrength: number;
  secure: boolean;
}

const DBMToSignalIcon: React.FC<DBMToSignalIconProps> = (props) => {
  console.log(props.secure);
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

export interface NetworkDetailsCardProps {
  wifiStatus: boolean;
  setWifiStatus: (newValue: boolean | null) => void;
  // connectedNetwork?: WiFiNetwork;
  networks?: WiFiNetwork[];
}

const NetworkDetailsCard: React.FC<NetworkDetailsCardProps> = (props) => {
  // Set the initial state of the Switch
  // console.log(props.wifiStatus);
  const [checked, setChecked] = useState(props.wifiStatus);

  // Handler function to toggle the Switch value
  const handleChange = async () => {
    props.setWifiStatus(await toggleWifiStatus(!props.wifiStatus));
    setChecked(!props.wifiStatus);
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
                checked={checked}
                onChange={handleChange}
                color='primary' // Set the color you want for the Switch
              />
            }
            label='Wi-Fi'
          />
        </FormGroup>
        {props.wifiStatus == true ? (
          <>
            <List dense={true}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar>
                    <SignalWifi4BarIcon sx={{ fontSize: 22.5, mx: 0.5 }} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={"Network Name"}
                  secondary={"Network Strength"}
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
                  {!props.wifiStatus ? (
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
                    <List dense={true}>
                      {props.networks !== undefined &&
                        props.networks.map((network: WiFiNetwork) => {
                          console.log(network.secure);
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
                                    marginRight: "20px",
                                    fontWeight: "bold",
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
                                secondary={network.secure ? "Secured" : "Unsecured"}
                              />
                            </ListItem>
                          );
                        })}
                    </List>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          </>
        ) : (
          <div></div>
        )}
      </CardContent>
    </Card>
  );
};

export default NetworkDetailsCard;
