// Material Dashboard 2 React layouts
// import Lights from './layouts/lights'
// import Misc from './layouts/misc'
// import WiFi from './layouts/wifi'

// Import Material-UI components and icons
import {
    Lightbulb as LightbulbIcon,
    SettingsOutlined as SettingsOutlinedIcon,
    SignalWifi0BarOutlined as SignalWifi0BarOutlinedIcon,
    StorageOutlined as StorageOutlinedIcon,
    SystemUpdateAlt as SystemUpdateAltIcon,
    VideoCameraBackOutlined as VideoCameraBackOutlinedIcon,
} from "@mui/icons-material";
import { Box } from "@mui/material";

import CamerasPage from "./layouts/cameras";
import Updater from "./layouts/updater";
import WifiPage from "./layouts/wifi";
import WiredPage from "./layouts/wired";
import { RouteItem, routeType } from "./types/types";

export const routes: RouteItem[] = [
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
        component: <Box />,
        // <Lights />,
        exact: true,
        icon: <LightbulbIcon />,
        category: "Devices",
        type: routeType.COLLAPSE,
        name: "Lights",
        key: "lights",
        default: false,
    },
    {
        route: "/devices/misc",
        component: <Box />,
        //  <Misc />,
        exact: true,
        icon: <SettingsOutlinedIcon />,
        category: "Devices",
        type: routeType.COLLAPSE,
        name: "Misc",
        key: "misc",
        default: false,
    },
    {
        route: "/communications/wifi",
        component: <WifiPage />,
        //  <WiFi />,
        exact: true,
        icon: <SignalWifi0BarOutlinedIcon />,
        category: "Communications",
        type: routeType.COLLAPSE,
        name: "WiFi",
        key: "wifi",
        default: false,
    },
    {
        route: "/communications/wired",
        component: <WiredPage />,
        exact: true,
        icon: <StorageOutlinedIcon />,
        category: "Communications",
        type: routeType.COLLAPSE,
        name: "Wired",
        key: "wired",
        default: false,
    },
    {
        route: "/options/updater",
        component: <Updater />,
        exact: true,
        icon: <SystemUpdateAltIcon />,
        category: "Options",
        type: routeType.COLLAPSE,
        name: "Updater",
        key: "updater",
        default: false,
    },
];
