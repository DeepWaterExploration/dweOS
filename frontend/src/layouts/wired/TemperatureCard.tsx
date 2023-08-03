import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import {
  Avatar,
  Card,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";
import React from "react";

import { fPercent } from "../../utils/formatNumber";

interface TemperatureCardProps {
  temperature: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function chunkArray<T extends any[]>(arr: T, size: number): T[] {
  return arr.reduce(
    (acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]),
    []
  );
}

const TemperatureCard: React.FC<TemperatureCardProps> = (props) => {
  return (
    <Card
      sx={{
        width: "512px",
        boxShadow: 3,
        textAlign: "left",
        margin: "20px",
        padding: "15px",
      }}
    >
      <List dense={true}>
        <ListItem
          secondaryAction={
            <IconButton
              edge='end'
              aria-label='delete'
              onClick={() => console.log("delete", `sasa`)}
            ></IconButton>
          }
        >
          <ListItemAvatar>
            <Avatar>
              <DeviceThermostatIcon sx={{ fontSize: 30, mx: 0.5 }} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary='Temperature'
            secondary={`Total Usage: ${fPercent(props.temperature)} °C`}
          />
        </ListItem>
        <ListItem>
          <Typography variant='h5' color='text.primary'>
            Temperature
          </Typography>
        </ListItem>
      </List>
      <Divider
        variant='middle'
        sx={{
          marginTop: 2,
          marginBottom: 2,
          borderBottomWidth: 3,
        }}
      />
    </Card>
  );
};

export default TemperatureCard;
