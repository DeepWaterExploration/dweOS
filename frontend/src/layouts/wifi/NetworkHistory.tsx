import SignalWifi0BarIcon from "@mui/icons-material/SignalWifi0Bar";
import SignalWifi4BarIcon from "@mui/icons-material/SignalWifi4Bar";
import SignalWifi4BarLockIcon from "@mui/icons-material/SignalWifi4BarLock";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";
import { useState } from "react";

import { forgetNetwork } from "./api";
import { SavedWifiNetwork, WiFiNetwork } from "./types";

export interface NetworkHistoryCardProps {
  savedNetworks: SavedWifiNetwork[] | null;
  setSavedNetworks: (network: SavedWifiNetwork[]) => void;
}

const NetworkHistoryCard: React.FC<NetworkHistoryCardProps> = (props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [forgettingNetwork, setForgettingNetwork] =
    useState<WiFiNetwork | null>(null);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogButtonTitle, setDialogButtonTitle] = useState("");
  const handleOpenDialogue = () => {
    setDialogOpen(true);
  };

  const handleCloseDialogue = () => {
    setDialogOpen(false);
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
        <DialogTitle sx={{ backgroundColor: "background.paper" }}>
          {dialogTitle}
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: "background.paper" }}>
          Are you sure you want to forget this network?
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
            onClick={() => {
              switch (dialogButtonTitle) {
                case "Forget": {
                  if (forgettingNetwork !== null) {
                    forgetNetwork(forgettingNetwork.ssid);
                    props.setSavedNetworks(
                      props.savedNetworks?.filter(
                        (savedNetwork) =>
                          savedNetwork.ssid !== forgettingNetwork?.ssid
                      ) || []
                    );
                    handleCloseDialogue();
                  }
                  break;
                }
                case "Disconnect": {
                  handleCloseDialogue();
                  break;
                }
              }
            }}
          >
            {dialogButtonTitle}
          </Button>
        </DialogActions>
      </Dialog>
      <CardHeader
        // action={deviceWarning}
        title={"Saved Networks"}
        sx={{ paddingBottom: "0px" }}
      />
      <CardContent>
        <Box
          sx={{
            backgroundColor: "background.paper",
            margin: "16px",
          }}
        >
          <List dense={true} style={{ maxHeight: 300, overflow: "auto" }}>
            {props.savedNetworks && props.savedNetworks.length > 0 ? (
              props.savedNetworks?.map((network) => (
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
                        setForgettingNetwork(network);
                        setDialogTitle(`Forget ${network.ssid}`);
                        setDialogButtonTitle("Forget");
                        handleOpenDialogue();
                      }}
                    >
                      Forget
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar>
                        <SignalWifi4BarIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={network.ssid}
                    secondary={
                      network.flags.includes("[CURRENT]")
                       ? "Connected" : "Not Connected"
                    }
                  />
                </ListItem>
              ))
            ) : (
              <ListItem
                style={{
                  margin: "10px 0px",
                }}
              >
                <ListItemAvatar>
                  <Avatar>
                    <SignalWifi0BarIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary='No saved networks'
                  secondary='Saved networks will appear here'
                />
              </ListItem>
            )}
          </List>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NetworkHistoryCard;
