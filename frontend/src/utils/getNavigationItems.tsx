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

interface CreateRouteItemProps {
    category: string;
    locationName: string;
    routes: RouteItem[];
    open: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    theme: any;
}

const CreateRouteItem: React.FC<CreateRouteItemProps> = (props) => {
    return (
        <React.Fragment>
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
                        opacity: props.open ? 1 : 0,
                        color: `${
                            props.locationName.includes(
                                props.category.toLowerCase()
                            )
                                ? props.theme.palette.primary.main
                                : "inherit"
                        } !important`,
                    }}
                >
                    {props.category}
                </Typography>
            </ListSubheader>
            {props.routes.map((route) => {
                if (route.route && route.route !== "/" && route.component) {
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
                                    justifyContent: props.open
                                        ? "initial"
                                        : "center",
                                    px: 2.5,
                                    // Determine the color based on route conditions
                                    color: `${
                                        // If the route is also the default route
                                        route.default
                                            ? // If the current location matches the route or is the root
                                              props.locationName ===
                                                  route.route ||
                                              props.locationName === "/"
                                                ? props.theme.palette.primary
                                                      .main
                                                : "inherit"
                                            : // If the current location matches the route
                                              props.locationName === route.route
                                              ? props.theme.palette.primary.main
                                              : "inherit"
                                    } !important`,
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: props.open ? 3 : "auto",
                                        justifyContent: "center",
                                        color: "inherit",
                                    }}
                                >
                                    {route.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={route.name}
                                    sx={{
                                        opacity: props.open ? 1 : 0,
                                        color: "inherit",
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

interface NavigationItemsProps {
    routes: RouteItem[];
    open: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    theme: any;
}

const NavigationItems: React.FC<NavigationItemsProps> = ({
    routes,
    open,
    theme,
}) => {
    const devicesRoutes = routes.filter(
        (route) => route.category === "Devices"
    );
    const communicationsRoutes = routes.filter(
        (route) => route.category === "Communications"
    );
    const optionsRoutes = routes.filter(
        (route) => route.category === "Options"
    );
    const locationName = useLocation().pathname;
    return (
        <React.Fragment>
            <CreateRouteItem
                category='Devices'
                locationName={locationName}
                routes={devicesRoutes}
                open={open}
                theme={theme}
            />
            <CreateRouteItem
                category='Communications'
                locationName={locationName}
                routes={communicationsRoutes}
                open={open}
                theme={theme}
            />
            <CreateRouteItem
                category='Options'
                locationName={locationName}
                routes={optionsRoutes}
                open={open}
                theme={theme}
            />
        </React.Fragment>
    );
};

export default NavigationItems;
