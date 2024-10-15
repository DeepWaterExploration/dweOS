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

import { routes } from "../../routes";
import DWELogo_white from "../../svg/DWELogo_white.svg";
import NavigationItems from "../../utils/getNavigationItems";
import NavigationRoutes from "../../utils/getRoutes";
import dweTheme from "../../utils/themes";

import { version } from "../../../package.json";
import { restartMachine, shutdownMachine } from "../../layouts/system/api";
import WebsocketContext from "../../contexts/WebsocketContext";
import { BACKEND_API_WS, deserializeMessage } from "../../utils/utils";
import DisconnectedOverlay from "./DisconnectedOverlay";
import { useSnackbar } from "notistack";
import { getStatus } from "./api";

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

    const websocket = useRef<WebSocket | undefined>(undefined);

    const [connected, setConnected] = useState(false);

    const connectedRef = useRef(false);

    const pingValues = useRef([]);

    const pingTimeouts = useRef({});

    const connectWebsocket = () => {
        // websocket
        if (websocket.current) delete websocket.current;

        websocket.current = new WebSocket(BACKEND_API_WS());

        websocket.current.onopen = () => {
            console.log("WebSocket opened.");
            setConnected(true);
        };

        websocket.current.addEventListener("message", (e) => {
            let msg = deserializeMessage(e.data);
            if (msg.event_name === "pong") {
                let id = msg.data["id"];

                if (pingTimeouts.current[id]) {
                    let ping = Date.now() - id;
                    pingValues.current.push(ping);
                    if (pingValues.current.length > 5)
                        pingValues.current.shift();
                    clearTimeout(pingTimeouts.current[id]);
                    delete pingTimeouts.current[id]; // Remove the timeout for this pong
                }
            }
        });

        websocket.current.onerror = () => {
            websocket.current.close();
        };
    };

    const calculateTimeout = () => {
        if (pingValues.current.length === 0) return 5000; // Default timeout if no ping values yet

        const sum = pingValues.current.reduce((a, b) => a + b, 0);
        const avgPing = sum / pingValues.current.length;
        const buffer = Math.log(avgPing + 1) * 1000;

        console.log(`AVG: ${avgPing}`);

        // Add a buffer to avoid premature timeouts
        return avgPing + buffer;
    };

    const ping = () => {
        const timeout = calculateTimeout();

        if (connected) {
            // instead of using the onclose event, just check here to be sure
            if (websocket.current.readyState === WebSocket.CLOSED) {
                setConnected(false);
                return;
            }

            if (websocket.current.readyState !== WebSocket.OPEN) return; // wait till

            const pingId = Date.now();

            websocket.current.send(
                JSON.stringify({
                    event_name: "ping",
                    data: { id: pingId },
                })
            );

            console.log(timeout);

            pingTimeouts.current[pingId] = setTimeout(() => {
                setConnected(false);
                console.error("timed out");
            }, timeout);
        }

        if (connectedRef.current) setTimeout(() => ping(), timeout * 1.2);
    };

    useEffect(() => {
        // hacky fix for timeouts
        connectedRef.current = connected;

        if (!connected) {
            if (websocket.current) websocket.current.close();
            Object.keys(pingTimeouts.current).forEach((id) => {
                clearTimeout(pingTimeouts.current[id]);
                delete pingTimeouts.current[id];
            });
            const interval = setInterval(() => {
                getStatus()
                    .then(() => {
                        if (!connectedRef.current) connectWebsocket();
                        clearInterval(interval);
                    })
                    .catch(() => {});
            }, 1000);
        } else {
            // Start pinging every 3 seconds
            ping();
        }
    }, [connected]);

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
                value={{ websocket: websocket.current, connected }}
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
                        <NavigationRoutes theme={theme.palette.mode} />
                    </React.Fragment>
                </Router>
            </WebsocketContext.Provider>
        </ThemeProvider>
    );
};

export default NavigationBar;
