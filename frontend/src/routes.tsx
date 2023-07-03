// Material Dashboard 2 React layouts
// import Cameras from 'layouts/cameras'
// import Lights from 'layouts/lights'
// import Misc from 'layouts/misc'
// import WiFi from 'layouts/wifi'
// import Wired from 'layouts/wired'

// Import Material-UI components and icons
import {
  Lightbulb as LightbulbIcon,
  SettingsOutlined as SettingsOutlinedIcon,
  SignalWifi0BarOutlined as SignalWifi0BarOutlinedIcon,
  StorageOutlined as StorageOutlinedIcon,
  VideoCameraBackOutlined as VideoCameraBackOutlinedIcon,
} from "@mui/icons-material";
import { Box } from "@mui/material";
import React from "react";

export interface RouteType {
  route: string;
  component: React.ReactNode;
  exact?: boolean;
  icon: React.ReactElement;
  category: string;
  type: string;
  name: string;
  key: string;
}

export const routes: RouteType[] = [
  {
    route: "/devices/cameras",
    component: <Box />,
    // <Cameras />,
    exact: true,
    icon: <VideoCameraBackOutlinedIcon />,
    category: "Devices",
    type: "collapse",
    name: "Cameras",
    key: "cameras",
  },
  {
    route: "/devices/lights",
    component: <Box />,
    // <Lights />,
    exact: true,
    icon: <LightbulbIcon />,
    category: "Devices",
    type: "collapse",
    name: "Lights",
    key: "lights",
  },
  {
    route: "/devices/misc",
    component: <Box />,
    //  <Misc />,
    exact: true,
    icon: <SettingsOutlinedIcon />,
    category: "Devices",
    type: "collapse",
    name: "Misc",
    key: "misc",
  },
  {
    route: "/communications/wifi",
    component: <Box />,
    //  <WiFi />,
    exact: true,
    icon: <SignalWifi0BarOutlinedIcon />,
    category: "Communications",
    type: "collapse",
    name: "WiFi",
    key: "wifi",
  },
  {
    route: "/communications/wired",
    component: <Box />,
    //  <Wired />,
    exact: true,
    icon: <StorageOutlinedIcon />,
    category: "Communications",
    type: "collapse",
    name: "Wired",
    key: "wired",
  },
];
