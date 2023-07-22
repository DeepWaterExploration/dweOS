import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuIcon from "@mui/icons-material/Menu";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
  Box,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Toolbar,
  Typography,
} from "@mui/material";
// eslint-disable-next-line import/named
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import MuiDrawer from "@mui/material/Drawer";
// eslint-disable-next-line import/named
import { CSSObject, Theme, ThemeProvider, styled } from "@mui/material/styles";
import React, { useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";

import { routes } from "../routes";
import DWELogo_white from "../svg/DWELogo_white.svg";
import { resetSettings } from "../utils/api";
import NavigationItems from "../utils/getNavigationItems";
import NavigationRoutes from "../utils/getRoutes";
import dweTheme from "../utils/themes";

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

export default function NavigationBar() {
  const [open, setOpen] = useState(true);
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") == "dark" ? dweTheme("dark") : dweTheme("light")
  );
  const toggleTheme = () => {
    const newTheme = theme.palette.mode === "dark" ? dweTheme("light") : dweTheme("dark");
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme.palette.mode);
  };
  const toggleDrawer = () => {
    setOpen(!open);
  };
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <React.Fragment>
          <AppBar position='absolute' open={open}>
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
                <Box style={{ marginTop: "5px" }} sx={{ pr: 3 }}>
                  <img
                    src={DWELogo_white}
                    style={{ height: 30 }}
                    alt='DWE Logo'
                  />
                </Box>
              </Box>
              <Grid justifyContent='flex-end'>{/* <WifiMenu /> */}</Grid>
              <PowerSettingsNewIcon />
              {/* {props.children} */}
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
                primary={"DWE OS Pre-Alpha"}
                secondary={"Version: 0.2.7"}
              />
              <IconButton onClick={toggleDrawer}>
                {theme.direction === "rtl" ? (
                  <ChevronRightIcon />
                ) : (
                  <ChevronLeftIcon />
                )}
              </IconButton>
            </DrawerHeader>
            <Divider />
            <List component='nav'>
              <NavigationItems routes={routes} open={open} />
              <Divider sx={{ my: 1 }} />
              <React.Fragment>
                <ListSubheader component='div' inset>
                  <Typography
                    variant='inherit'
                    fontWeight='bold'
                    sx={{ opacity: open ? 1 : 0 }}
                  >
                    Options
                  </Typography>
                </ListSubheader>
                <ListItem disablePadding sx={{ display: "block" }}>
                  <ListItemButton
                    onClick={toggleTheme}
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
                      }}
                    >
                      {theme.palette.mode === "light" ? (
                        <Brightness7Icon />
                      ) : (
                        <Brightness4Icon />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        theme.palette.mode === "light"
                          ? "Light Theme"
                          : "Dark Theme"
                      }
                      sx={{ opacity: open ? 1 : 0 }}
                    />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding sx={{ display: "block" }}>
                  <ListItemButton
                    onClick={resetSettings}
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
                      }}
                    >
                      <RestartAltIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary='Reset Settings'
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
    </ThemeProvider>
  );
}
