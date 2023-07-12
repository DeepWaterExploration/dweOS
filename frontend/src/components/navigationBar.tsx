import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
  Box,
  Divider,
  Grid,
  IconButton,
  List,
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
import { ThemeProvider, styled } from "@mui/material/styles";
import React, { useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";

import DWELogo_white from "../svg/DWELogo_white.svg";
import { resetSettings } from "../utils/api";
import NavigationItems from "../utils/getNavigationItems";
import NavigationRoutes from "../utils/getRoutes";
import { darkTheme, lightTheme } from "../utils/themes";

const drawerWidth = 240;

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
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: "border-box",
    ...(!open && {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

export default function NavigationBar() {
  const [open, setOpen] = useState(true);
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") == "dark" ? darkTheme : lightTheme
  );
  const toggleTheme = () => {
    const newTheme = theme.palette.mode === "dark" ? lightTheme : darkTheme;
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
            <Toolbar
              sx={{
                pr: "24px", // keep right padding when drawer closed
              }}
            >
              <IconButton
                edge='start'
                color='inherit'
                aria-label='open drawer'
                onClick={toggleDrawer}
                sx={{
                  marginRight: "20px",
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
            <Toolbar
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                px: [1],
              }}
            >
              <ListItemText
                style={{
                  textAlign: "center",
                  padding: "auto",
                }}
                primary={"DWE OS Pre-Alpha"}
                // secondary={'Version: ' + packageBackend.version}
              />
              <IconButton onClick={toggleDrawer}>
                <ChevronLeftIcon />
              </IconButton>
            </Toolbar>
            <Divider />
            <List component='nav'>
              <NavigationItems />
              <Divider sx={{ my: 1 }} />
              <React.Fragment>
                <ListSubheader component='div' inset>
                  <Typography variant='inherit' fontWeight='bold'>
                    Options
                  </Typography>
                </ListSubheader>
                <ListItemButton onClick={toggleTheme}>
                  <ListItemIcon>
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
                  />
                </ListItemButton>
                <ListItemButton onClick={resetSettings}>
                  <ListItemIcon>
                    <RestartAltIcon />
                  </ListItemIcon>
                  <ListItemText primary='Reset Settings' />
                </ListItemButton>
              </React.Fragment>
            </List>
          </Drawer>
          <NavigationRoutes theme={theme.palette.mode} />
        </React.Fragment>
      </Router>
    </ThemeProvider>
  );
}
