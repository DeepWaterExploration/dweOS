import React, { ReactNode } from 'react';
import { Route } from 'react-router-dom';

// routes to different pages
import { routes, RouteType } from '../routes'

import {
  Divider,
  ListSubheader,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Typography,
} from '@mui/material';

const GetRoutes = (routes: RouteType[]): ReactNode => {
  const devicesRoutes = routes.filter((route) => route.category === 'Devices');
  const communicationsRoutes = routes.filter(
    (route) => route.category === 'Communications'
  );

  return (
    <React.Fragment>
      <Divider sx={{ my: 1 }} />
      <ListSubheader component="div" inset>
        <Typography variant="inherit" fontWeight="bold">
          Devices
        </Typography>
      </ListSubheader>
      {devicesRoutes.map((route) => {
        if (route.route) {
          return (
            <Route
              path={route.route}
              element={route.component}
              key={route.key}
            >
              <ListItemButton>
                <ListItemIcon>
                  {route.icon}
                </ListItemIcon>
                <ListItemText primary={route.name} />
              </ListItemButton>
            </Route>
          )
        }
        return null; // Add a default return value if the if condition is not met
      })}
      <ListSubheader component="div" inset>
        <Typography variant="inherit" fontWeight="bold">
        Communications
        </Typography>
      </ListSubheader>
      {communicationsRoutes.map((route) => {
        if (route.route) {
          return (
            <Route
              path={route.route}
              element={route.component}
              key={route.key}
            >
              <ListItemButton>
                <ListItemIcon>
                  {route.icon}
                </ListItemIcon>
                <ListItemText primary={route.name} />
              </ListItemButton>
            </Route>
          )
        }
        return null; // Add a default return value if the if condition is not met
      })}
      <Divider sx={{ my: 1 }} />
    </React.Fragment>
  );
};

const NavigationRoutes = GetRoutes(routes);

export default NavigationRoutes
