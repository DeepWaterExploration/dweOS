import {
  Avatar,
  Button,
  Card,
  CardHeader,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";
import React, { useEffect, useState } from "react";

import {
  getAvailableWifi,
  getConnectedNetwork,
  getSavedWifi,
  getWifiStatus,
  toggleWifiStatus,
} from "./api";
// import NetworkDetailsCard from "./NetworkDetails";
import NetworkHistoryCard from "./NetworkHistory";
import NetworkSettingsCard from "./NetworkSettings";
import {
  GetWifiStatusResponse,
  SavedWifiNetwork,
  ScannedWifiNetwork,
  WiFiNetwork,
} from "./types";
import { SignalWifi1Bar } from "@mui/icons-material";

const Wifi: React.FC = () => {
  const [currentNetwork, setCurrentNetwork] = useState("");

  getWifiStatus().then((status) => {
    setCurrentNetwork(status.ssid);
  });

  return (
    <Grid
      container
      spacing={4}
      alignItems='baseline'
      flexWrap='wrap'
      style={{
        justifyContent: "left",
        padding: "0 3em",
      }}
    >
      <>
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
          <List dense={true}>
            <ListItem>
              <ListItemAvatar>
                <Avatar>
                  <SignalWifi1Bar sx={{ fontSize: 22.5, mx: 0.5 }} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={currentNetwork}
                secondary={`100 dBm`}
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
        </Card>
      </>
    </Grid>
  );
};

export default Wifi;
