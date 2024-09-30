// Import Material-UI components and icons
import {
    Lightbulb as LightbulbIcon,
    // SettingsOutlined as SettingsOutlinedIcon,
    SignalWifi0BarOutlined as SignalWifi0BarOutlinedIcon,
    Settings as SettingsIcon,
    // StorageOutlined as StorageOutlinedIcon,
    // SystemUpdateAlt as SystemUpdateAltIcon,
    VideoCameraBackOutlined as VideoCameraBackOutlinedIcon,
} from "@mui/icons-material";

import CamerasPage from "./layouts/cameras";
// import Updater from "./layouts/updater";
// import TaskMonitor from "./layouts/task_monitor";
import LogsPage from "./layouts/logs_page";
import WifiPage from "./layouts/wifi";
import { RouteItem, routeType } from "./types/types";
import React from "react";
import TerminalIcon from "@mui/icons-material/Terminal";
import LightsLayout from "./layouts/lights";
import PreferencesLayout from "./layouts/preferences";

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
        route: "/preferences",
        component: <PreferencesLayout />,
        icon: <SettingsIcon />,
        category: "Options",
        type: routeType.COLLAPSE,
        name: "Preferences",
        key: "preferences",
        default: false,
    },
    // Will be added in future release
    // {
    //     route: "/devices/task_monitor",
    //     component: <TaskMonitor />,
    //     exact: true,
    //     icon: <SettingsOutlinedIcon />,
    //     category: "Devices",
    //     type: routeType.COLLAPSE,
    //     name: "Task Monitor",
    //     key: "task_monitor",
    //     default: false,
    // },
    // {
    //     route: "/communications/wifi",
    //     component: <WifiPage />,
    //     exact: true,
    //     icon: <SignalWifi0BarOutlinedIcon />,
    //     category: "Communications",
    //     type: routeType.COLLAPSE,
    //     name: "WiFi",
    //     key: "wifi",
    //     default: false,
    // },
    {
        route: "/communications/logs",
        component: <LogsPage />,
        exact: true,
        icon: <TerminalIcon />,
        category: "Communications",
        type: routeType.COLLAPSE,
        name: "Logs",
        key: "logs",
        default: false,
    },
    // Will be added in future release
    // {
    //     route: "/communications/wired",
    //     component: <Box />,
    //     exact: true,
    //     icon: <StorageOutlinedIcon />,
    //     category: "Communications",
    //     type: routeType.COLLAPSE,
    //     name: "Wired",
    //     key: "wired",
    //     default: false,
    // },
    // Will be added in future release
    // {
    //     route: "/options/updater",
    //     component: <Updater />,
    //     exact: true,
    //     icon: <SystemUpdateAltIcon />,
    //     category: "Options",
    //     type: routeType.COLLAPSE,
    //     name: "Updater",
    //     key: "updater",
    //     default: false,
    // },
];
