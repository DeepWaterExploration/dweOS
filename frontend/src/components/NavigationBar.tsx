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
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";

import { routes } from "../routes";
import DWELogo_white from "../svg/DWELogo_white.svg";
import NavigationItems from "../utils/getNavigationItems";
import NavigationRoutes from "../utils/getRoutes";
import dweTheme from "../utils/themes";

import { version } from "../../package.json";
import { restartMachine, shutdownMachine } from "../layouts/system/api";
import WebsocketContext from "../contexts/WebsocketContext";
import { BACKEND_API_WS, useDidMountEffect } from "../utils/utils";
import DisconnectedOverlay from "./DisconnectedOverlay";
import { useSnackbar } from "notistack";

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

    const [websocket, setWebsocket] = useState<WebSocket | undefined>(
        new WebSocket(BACKEND_API_WS)
    );

    const [connected, setConnected] = useState(false);

    const connectWebsocket = () => {
        // websocket
        setWebsocket(new WebSocket(BACKEND_API_WS));
    };

    useEffect(() => {
        websocket.onopen = () => {
            console.log("Websocket reopened.");
            setConnected(true);
        };

        websocket.onerror = () => {
            websocket.close();
        };

        websocket.onclose = () => {
            setConnected(false);
            setTimeout(connectWebsocket, 1000);
        };
    }, [websocket]);

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
            <WebsocketContext.Provider value={{ websocket, connected }}>
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
