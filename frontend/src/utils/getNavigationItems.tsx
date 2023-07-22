import {
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Typography,
} from "@mui/material";
import React from "react";
import { Link, useLocation } from "react-router-dom";

// routes to different pages
import { RouteItem } from "../types/types";

interface NavigationItemsProps {
  routes: RouteItem[];
  open: boolean;
  theme: any;
}

const NavigationItems: React.FC<NavigationItemsProps> = ({
  routes,
  open,
  theme,
}) => {
  const devicesRoutes = routes.filter((route) => route.category === "Devices");
  const communicationsRoutes = routes.filter(
    (route) => route.category === "Communications"
  );
  const locationName = useLocation().pathname;
  return (
    <React.Fragment>
      <ListSubheader
        component='div'
        inset
        sx={{ background: "inherit !important" }}
      >
        <Typography
          variant='inherit'
          fontWeight='bold'
          sx={{
            opacity: open ? 1 : 0,
            color: `${
              locationName.includes("devices")
                ? theme.palette.primary.main
                : "inherit"
            } !important`,
          }}
        >
          Devices
        </Typography>
      </ListSubheader>
      {devicesRoutes.map((route) => {
        if (route.route && route.component) {
          return (
            <ListItem
              disablePadding
              key={route.key}
              component={Link}
              to={route.route}
              sx={{
                display: "block",
              }}
            >
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? "initial" : "center",
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : "auto",
                    justifyContent: "center",
                    color: `${
                      locationName === route.route
                        ? theme.palette.primary.main
                        : "inherit"
                    } !important`,
                  }}
                >
                  {route.icon}
                </ListItemIcon>
                <ListItemText
                  primary={route.name}
                  sx={{
                    opacity: open ? 1 : 0,
                    color: `${
                      locationName === route.route
                        ? theme.palette.primary.main
                        : "inherit"
                    } !important`,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        }
      })}
      <Divider sx={{ my: 1 }} />
      <ListSubheader
        component='div'
        inset
        sx={{ background: "inherit !important" }}
      >
        <Typography
          variant='inherit'
          fontWeight='bold'
          sx={{
            opacity: open ? 1 : 0,
            color: `${
              locationName.includes("communications")
                ? theme.palette.primary.main
                : "inherit"
            } !important`,
          }}
        >
          Communications
        </Typography>
      </ListSubheader>
      {communicationsRoutes.map((route) => {
        if (route.route && route.component) {
          return (
            <ListItem
              disablePadding
              key={route.key}
              component={Link}
              to={route.route}
              sx={{ display: "block" }}
            >
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? "initial" : "center",
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : "auto",
                    justifyContent: "center",
                    color: `${
                      locationName === route.route
                        ? theme.palette.primary.main
                        : "inherit"
                    } !important`,
                  }}
                >
                  {route.icon}
                </ListItemIcon>
                <ListItemText
                  primary={route.name}
                  sx={{
                    opacity: open ? 1 : 0,
                    color: `${
                      locationName === route.route
                        ? theme.palette.primary.main
                        : "inherit"
                    } !important`,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        }
      })}
    </React.Fragment>
  );
};

// interface NavigationItemsProps {
//   open: boolean;
// }

// const NavigationItems: React.FC<NavigationItemsProps> = (): JSX.Element => {
//   return <GetRoutes routes={routes} open={open} />;
// };

export default NavigationItems;
