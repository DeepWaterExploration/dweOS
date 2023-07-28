import SignalWifi4BarIcon from "@mui/icons-material/SignalWifi4Bar";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Switch,
  Typography,
} from "@mui/material";
import { useState } from "react";

import { toggleWifiStatus } from "./api";

// import { WiFiNetwork } from "./types"

export interface NetworkDetailsCardProps {
  wifiStatus: boolean;
  setWifiStatus: (newValue: boolean | null) => void;
  // connectedNetwork?: WiFiNetwork;
  // networks?: WiFiNetwork[];
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
                <Typography fontWeight='800'>Stream Endpoints</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box
                  sx={{
                    backgroundColor: "background.paper",
                  }}
                >
                  {/* {endpoints.length === 0 ? (
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
                      {endpoints.map((endpoint) => {
                        return (
                          <ListItem
                            key={`${endpoint.host}:${endpoint.port}`}
                            secondaryAction={
                              <IconButton
                                edge='end'
                                aria-label='delete'
                                onClick={() => {
                                  setEndpoints((prevEndpoints) =>
                                    prevEndpoints.filter(
                                      (e) =>
                                        `${e.host}:${e.port}` !==
                                        `${endpoint.host}:${endpoint.port}`
                                    )
                                  );
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          >
                            <ListItemAvatar>
                              <Avatar>
                                <LinkedCameraIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={`IP Address: ${endpoint.host}`}
                              secondary={`Port: ${endpoint.port}`}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  )} */}
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
