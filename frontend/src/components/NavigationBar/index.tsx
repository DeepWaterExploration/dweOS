import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuIcon from "@mui/icons-material/Menu";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import MuiDrawer from "@mui/material/Drawer";
import { CSSObject, Theme, ThemeProvider, styled } from "@mui/material/styles";
import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";

// Import Material-UI components and icons
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import SignalWifi0BarOutlinedIcon from "@mui/icons-material/SignalWifi0BarOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import VideoCameraBackOutlinedIcon from "@mui/icons-material/VideoCameraBackOutlined";
import TerminalIcon from "@mui/icons-material/Terminal";
import StorageIcon from "@mui/icons-material/Storage";

// import Updater from "./layouts/updater";
// import TaskMonitor from "./layouts/task_monitor";
import CamerasPage from "../../layouts/cameras";
import LogsPage from "../../layouts/logs_page";
import WifiPage from "../../layouts/wifi";
import { RouteItem, routeType } from "../../types/types";
import LightsLayout from "../../layouts/lights";
import PreferencesLayout from "../../layouts/preferences";
import TerminalLayout from "../../layouts/terminal";

// import { routes } from "../../routes";
import DWELogo_white from "../../svg/DWELogo_white.svg";
import NavigationItems from "../../utils/getNavigationItems";
import NavigationRoutes from "../../utils/getRoutes";
import dweTheme from "../../utils/themes";

import { version } from "../../../package.json";
import { restartMachine, shutdownMachine } from "../../layouts/system/api";
import WebsocketContext from "../../contexts/WebsocketContext";
import { deserializeMessage } from "../../utils/utils";
import DisconnectedOverlay from "./DisconnectedOverlay";
import { useSnackbar } from "notistack";
import { getStatus } from "./api";
import { FeatureSupport } from "../../utils/types";
import { getFeatureSupport } from "../../utils/api";
import { io, Socket } from "socket.io-client";

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
    width: drawerWidth,
    transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
    transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: "hidden",
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up("sm")]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
});

const DrawerHeader = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
}

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const Drawer = styled(MuiDrawer, {
    shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    ...(open && {
        ...openedMixin(theme),
        "& .MuiDrawer-paper": openedMixin(theme),
    }),
    ...(!open && {
        ...closedMixin(theme),
        "& .MuiDrawer-paper": closedMixin(theme),
    }),
}));

const generateRoutes = (features: FeatureSupport) => {
    return [
        {
            route: "/devices/cameras",
            component: <CamerasPage />,
            exact: true,
            icon: <VideoCameraBackOutlinedIcon />,
            category: "Devices",
            type: routeType.COLLAPSE,
            name: "Cameras",
            key: "cameras",
            default: true,
        },
        {
            route: "/devices/lights",
            component: <LightsLayout />,
            exact: true,
            icon: <LightbulbIcon />,
            category: "Devices",
            type: routeType.COLLAPSE,
            name: "Lights",
            key: "lights",
            default: false,
        },
        {
            route: "/options/preferences",
            exact: true,
            component: <PreferencesLayout />,
            icon: <SettingsIcon />,
            category: "Options",
            type: routeType.COLLAPSE,
            name: "Preferences",
            key: "preferences",
            default: false,
        },
        ...(features.wifi
            ? [
                  {
                      route: "/communications/wifi",
                      component: <WifiPage />,
                      exact: true,
                      icon: <SignalWifi0BarOutlinedIcon />,
                      category: "Communications",
                      type: routeType.COLLAPSE,
                      name: "WiFi",
                      key: "wifi",
                      default: false,
                  },
              ]
            : []),
        {
            route: "/communications/logs",
            component: <LogsPage />,
            exact: true,
            icon: <StorageIcon />,
            category: "Communications",
            type: routeType.COLLAPSE,
            name: "Logs",
            key: "logs",
            default: false,
        },
        ...(features.ttyd
            ? [
                  {
                      route: "/communications/terminal",
                      component: <TerminalLayout />,
                      exact: true,
                      icon: <TerminalIcon />,
                      category: "Communications",
                      type: routeType.COLLAPSE,
                      name: "Terminal",
                      key: "terminal",
                      default: false,
                  },
              ]
            : []),
    ];
};

const NavigationBar = () => {
    const [open, setOpen] = useState(true);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);
    const { enqueueSnackbar } = useSnackbar();
    const [theme, setTheme] = useState(
        localStorage.getItem("theme") == "light"
            ? dweTheme("light")
            : dweTheme("dark")
    );

    const socket = useRef<Socket | undefined>(undefined);

    const [connected, setConnected] = useState(false);

    const connectedRef = useRef(false);

    const pingValues = useRef([]);

    const pingTimeouts = useRef({});

    const [features, setFeatures] = useState({
        ttyd: true,
        wifi: true,
    } as FeatureSupport);

    const [routes, setRoutes] = useState(generateRoutes(features));

    const connectWebsocket = () => {
        if (socket.current) delete socket.current;

        socket.current = io(
            import.meta.env.DEV ? "http://localhost:5000" : undefined,
            { transports: ["websocket"] }
        );

        socket.current.on("connect", () => {
            console.log(socket.current.id);
            setConnected(true);
        });

        socket.current.on("asdf", () => {
            console.log("asdf");
        });
    };

    useEffect(() => {
        // hacky fix for timeouts
        connectedRef.current = connected;

        if (!connected) {
            connectWebsocket();
        } else {
            // Start pinging every 3 seconds
            // ping();

            // get the supported features
            getFeatureSupport().then(setFeatures);
        }
    }, [connected]);

    useEffect(() => {
        setRoutes(generateRoutes(features));
    }, [features]);

    const toggleTheme = () => {
        const newTheme =
            theme.palette.mode === "dark"
                ? dweTheme("light")
                : dweTheme("dark");
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme.palette.mode);
    };

    const toggleDrawer = () => {
        setOpen(!open);
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <ThemeProvider theme={theme}>
            <WebsocketContext.Provider
                value={{ socket: socket.current, connected }}
            >
                <Router>
                    <React.Fragment>
                        <AppBar
                            position='absolute'
                            open={open}
                            enableColorOnDark
                        >
                            <Toolbar>
                                <IconButton
                                    color='inherit'
                                    aria-label='open drawer'
                                    onClick={toggleDrawer}
                                    edge='start'
                                    sx={{
                                        marginRight: 5,
                                        ...(open && { display: "none" }),
                                    }}
                                >
                                    <MenuIcon />
                                </IconButton>
                                <Box
                                    component='div'
                                    display='flex'
                                    flexDirection='row'
                                    alignItems='center'
                                    sx={{ width: "100%", gap: 2 }}
                                >
                                    <Box
                                        style={{ marginTop: "5px" }}
                                        sx={{ pr: 3 }}
                                    >
                                        <img
                                            src={DWELogo_white}
                                            style={{ height: 30 }}
                                            alt='DWE Logo'
                                        />
                                    </Box>
                                </Box>

                                {/* {!connected && (
                                    
                                )} */}

                                <Box
                                    sx={{
                                        display: "inline-block",
                                        padding: "8px 16px",
                                        backgroundColor: connected
                                            ? theme.palette.success.main
                                            : theme.palette.error.main, // MUI's error color
                                        color: theme.palette.error.contrastText, // Contrast text for error button
                                        borderRadius: "6px",
                                        textAlign: "center",
                                        userSelect: "none", // Prevent text selection
                                        marginRight: "10px",
                                    }}
                                >
                                    <Typography>
                                        {connected
                                            ? "Connected"
                                            : "Disconnected"}
                                    </Typography>
                                </Box>
                                <DisconnectedOverlay
                                    open={!connected}
                                    zIndex={theme.zIndex.drawer + 1}
                                />
                                <IconButton
                                    aria-controls={
                                        menuOpen ? "basic-menu" : undefined
                                    }
                                    aria-haspopup='true'
                                    aria-expanded={
                                        menuOpen ? "true" : undefined
                                    }
                                    onClick={handleClick}
                                >
                                    <PowerSettingsNewIcon
                                        sx={{
                                            color: "white",
                                        }}
                                    />
                                </IconButton>

                                <Menu
                                    anchorEl={anchorEl}
                                    open={menuOpen}
                                    onClose={handleClose}
                                    sx={{
                                        "& .MuiMenu-paper": {
                                            backgroundColor:
                                                theme.palette.mode === "dark"
                                                    ? "black"
                                                    : theme.palette.primary
                                                          .main,
                                        },
                                    }}
                                >
                                    <MenuItem
                                        onClick={() => {
                                            handleClose();
                                            shutdownMachine();
                                            enqueueSnackbar(
                                                "System shutting down!",
                                                { variant: "info" }
                                            );
                                        }}
                                        sx={{
                                            color: "white",
                                        }}
                                    >
                                        Shut Down
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => {
                                            handleClose();
                                            restartMachine();
                                            enqueueSnackbar(
                                                "System restarting!",
                                                { variant: "info" }
                                            );
                                        }}
                                        sx={{
                                            color: "white",
                                        }}
                                    >
                                        Restart
                                    </MenuItem>
                                </Menu>
                            </Toolbar>
                        </AppBar>
                        <Drawer variant='permanent' open={open}>
                            <DrawerHeader>
                                <ListItemText
                                    style={{
                                        textAlign: "center",
                                        padding: "auto",
                                        justifyContent: "center",
                                    }}
                                    primary={
                                        <div>
                                            <Tooltip title='This is beta software, there may be unfinished features or bugs.'>
                                                <span>DWE OS 2.0</span>
                                            </Tooltip>
                                        </div>
                                    }
                                    secondary={`Version: ${version}`}
                                />
                                <IconButton onClick={toggleDrawer}>
                                    {theme.direction === "rtl" ? (
                                        <ChevronRightIcon />
                                    ) : (
                                        <ChevronLeftIcon />
                                    )}
                                </IconButton>
                            </DrawerHeader>
                            <List component='nav'>
                                <NavigationItems
                                    routes={routes}
                                    open={open}
                                    theme={theme}
                                />
                                <React.Fragment>
                                    <ListItem
                                        disablePadding
                                        sx={{ display: "block" }}
                                    >
                                        <ListItemButton
                                            onClick={toggleTheme}
                                            sx={{
                                                minHeight: 48,
                                                justifyContent: open
                                                    ? "initial"
                                                    : "center",
                                                px: 2.5,
                                            }}
                                        >
                                            <ListItemIcon
                                                sx={{
                                                    minWidth: 0,
                                                    mr: open ? 3 : "auto",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                {theme.palette.mode ===
                                                "light" ? (
                                                    <Brightness7Icon />
                                                ) : (
                                                    <Brightness4Icon />
                                                )}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    theme.palette.mode ===
                                                    "light"
                                                        ? "Light Theme"
                                                        : "Dark Theme"
                                                }
                                                sx={{ opacity: open ? 1 : 0 }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                </React.Fragment>
                            </List>
                        </Drawer>
                        <NavigationRoutes
                            theme={theme.palette.mode}
                            routes={routes}
                        />
                    </React.Fragment>
                </Router>
            </WebsocketContext.Provider>
        </ThemeProvider>
    );
};

export default NavigationBar;
