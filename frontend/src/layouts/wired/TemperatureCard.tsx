import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
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
import React, { useState } from "react";

interface TemperatureCardProps {
  cpuTemp: number;
  minTemp: number;
  maxTemp: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function chunkArray<T extends any[]>(arr: T, size: number): T[] {
  return arr.reduce(
    (acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]),
    []
  );
}

const TemperatureCard: React.FC<TemperatureCardProps> = (props) => {
  console.log("maxTemp in TemperatureCard:", props.maxTemp);
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
            secondary={`Total Temperature: ${props.cpuTemp}°C`}
          />
        </ListItem>
        <ListItem>
          <Typography variant='h5' color='text.primary'>
            Temperature
          </Typography>
        </ListItem>
      </List>
      <ListItem>
        <Grid
          container
          item
          xs={12}
          spacing={3}
          justifyContent='space-evenly'
          alignItems='center'
        >
          <Grid item xs={12} sm={6} md={3} justifyContent='space-evenly'>
            <Grid
              flexDirection={"column"}
              justifyContent='center'
              alignItems='center'
            >
              <Typography variant='body1' color='text.primary'>
                CPU
              </Typography>
              <Typography variant='body1' color='text.primary'>
                {props.cpuTemp}°C
              </Typography>
            </Grid>
          </Grid>
          <Grid item xs={12} sm={6} md={3} justifyContent='space-evenly'>
            <Grid
              flexDirection={"column"}
              justifyContent='center'
              alignItems='center'
            >
              <Typography variant='body1' color='text.primary'>
                Minimum
              </Typography>
              <Typography variant='body1' color='text.primary'>
                {props.minTemp}°C
              </Typography>
            </Grid>
          </Grid>
          <Grid item xs={12} sm={6} md={3} justifyContent='space-evenly'>
            <Grid
              flexDirection={"column"}
              justifyContent='center'
              alignItems='center'
            >
              <Typography variant='body1' color='text.primary'>
                Maximum
              </Typography>
              <Typography variant='body1' color='text.primary'>
                {props.maxTemp}°C
              </Typography>
            </Grid>
          </Grid>
          <Grid item xs={12} sm={6} md={3} justifyContent='space-evenly'>
            <Grid
              flexDirection={"column"}
              justifyContent='center'
              alignItems='center'
            >
              <Typography variant='body1' color='text.primary'>
                Critical
              </Typography>
              <Typography variant='body1' color='text.primary'>
                {props.cpuTemp}°C
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </ListItem>
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
