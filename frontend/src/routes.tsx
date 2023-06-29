import React from 'react';

// Material Dashboard 2 React layouts
import Cameras from 'layouts/cameras'
import Lights from 'layouts/lights'
import Misc from 'layouts/misc'
import WiFi from 'layouts/wifi'
import Wired from 'layouts/wired'

// Import Material-UI components and icons
import {
  VideoCameraBackOutlined as VideoCameraBackOutlinedIcon,
  Lightbulb as LightbulbIcon,
  SettingsOutlined as SettingsOutlinedIcon,
  SignalWifi0BarOutlined as SignalWifi0BarOutlinedIcon,
  StorageOutlined as StorageOutlinedIcon,
} from '@mui/icons-material';

export interface RouteType {
  route: string;
  component: React.ReactNode
  exact?: boolean;
  icon: React.ReactElement;
  category: string;
  type: string;
  name: string;
  key: string;
}

export const routes: RouteType[] = [
  {
    route: '/devices/cameras',
    component: <Cameras />,
    exact: true,
    icon: (
      <VideoCameraBackOutlinedIcon/>
    ),
    category: 'Devices',
    type: 'collapse',
    name: 'Cameras',
    key: 'cameras',
  },
  {
    route: '/devices/lights',
    component: <Lights />,
    exact: true,
    icon: (
      <LightbulbIcon />
    ),
    category: 'Devices',
    type: 'collapse',
    name: 'Lights',
    key: 'lights',
  },
  {
    route: '/devices/misc',
    component: <Misc />,
    exact: true,
    icon: (
      <SettingsOutlinedIcon />
    ),
    category: 'Devices',
    type: 'collapse',
    name: 'Misc',
    key: 'misc',
  },
  {
    route: '/communications/wifi',
    component: <WiFi />,
    exact: true,
    icon: (
      <SignalWifi0BarOutlinedIcon />
    ),
    category: 'Communications',
    type: 'collapse',
    name: 'WiFi',
    key: 'wifi',
  },
  {
    route: '/communications/wired',
    component: <Wired />,
    exact: true,
    icon: (
      <StorageOutlinedIcon />
    ),
    category: 'Communications',
    type: 'collapse',
    name: 'Wired',
    key: 'wired',
  },
];
