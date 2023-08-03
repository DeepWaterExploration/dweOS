import BrowserUpdatedSharpIcon from "@mui/icons-material/BrowserUpdatedSharp";
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import React from "react";

export interface VersionItemProps {
  isInstallable: boolean;
  isMostRecent: boolean;
  dateReleased: Date;
  version: string;
}

const VersionItem: React.FC<VersionItemProps> = (props) => {
  const currentDate = new Date();
  const daysSince = Math.floor(
    (currentDate.getTime() - props.dateReleased.getTime()) / (1000 * 3600 * 24)
  );
  return (
    <ListItem
      secondaryAction={
        props.isInstallable ? (
          <Button variant='contained'>Install</Button>
        ) : undefined
      }
    >
      <ListItemAvatar>
        <Avatar>
          <BrowserUpdatedSharpIcon />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={`DWE OS 1.2.1`}
        secondary={
          (props.isMostRecent ? "Most Recent - " : "") +
          daysSince +
          (daysSince !== 1 ? " days ago" : " day ago")
        }
      />
    </ListItem>
  );
};

const Updater: React.FC = () => {
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
      <Card
        sx={{
          minWidth: 512,
          boxShadow: 3,
          textAlign: "left",
          margin: "20px",
          padding: "15px",
        }}
      >
        <CardHeader title={"OS Updater"} />
        <CardContent sx={{ marginTop: "-20px" }}>
          <Typography sx={{ fontSize: "1rem" }} color='text.secondary'>
            Current Version
          </Typography>
          <VersionItem
            isInstallable={false}
            isMostRecent={true}
            version='1.2.1'
            dateReleased={new Date("07/31/2023")}
          />
          <Typography
            sx={{ fontSize: "1rem" }}
            color='text.secondary'
            marginTop={"5px"}
          >
            Available Versions
          </Typography>
          <Paper
            style={{
              maxHeight: 300,
              overflow: "auto",
              marginTop: "14px",
            }}
            elevation={4}
          >
            <List>
              <VersionItem
                isInstallable={true}
                isMostRecent={false}
                version='1.2.0'
                dateReleased={new Date("07/26/2023")}
              />
            </List>
          </Paper>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default Updater;
