import {
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Typography,
} from "@mui/material";
import React from "react";
import { Link } from "react-router-dom";

// routes to different pages
import { RouteType, routes } from "../routes";

interface GetRoutesProps {
  routes: RouteType[];
}

const GetRoutes = ({ routes }: GetRoutesProps): JSX.Element => {
  const devicesRoutes = routes.filter(route => route.category === "Devices");
  const communicationsRoutes = routes.filter(
    route => route.category === "Communications"
  );
  return (
    <React.Fragment>
      <ListSubheader component='div' inset>
        <Typography variant='inherit' fontWeight='bold'>
          Devices
        </Typography>
      </ListSubheader>
      <List>
        {devicesRoutes.map(route => {
          if (route.route && route.component) {
            return (
              <ListItem key={route.key} component={Link} to={route.route}>
                <ListItemIcon>{route.icon}</ListItemIcon>
                <ListItemText primary={route.name} />
              </ListItem>
            );
          }
          // return null; // Add a default return value if the if condition is not met
        })}
      </List>
      <Divider sx={{ my: 1 }} />
      <ListSubheader component='div' inset>
        <Typography variant='inherit' fontWeight='bold'>
          Communications
        </Typography>
      </ListSubheader>
      <List>
        {communicationsRoutes.map(route => {
          if (route.route && route.component) {
            return (
              <ListItem key={route.key} component={Link} to={route.route}>
                <ListItemIcon>{route.icon}</ListItemIcon>
                <ListItemText primary={route.name} />
              </ListItem>
            );
          }
          // return null; // Add a default return value if the if condition is not met
        })}
      </List>
    </React.Fragment>
  );
};

const NavigationItems = (): JSX.Element => {
  return <GetRoutes routes={routes} />;
};

export default NavigationItems;
