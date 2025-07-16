"use client";

import * as React from "react";
import {
  Home,
  CameraIcon,
  SettingsIcon,
  LogsIcon,
  TerminalIcon,
  VideoIcon,
} from "lucide-react";

import DWELogo from "@/assets/dwe-logo.svg";
import DWELogoDark from "@/assets/dwe-logo-dark.svg";

import { NavMain } from "@/components/nav-main";
import { Sidebar, SidebarHeader } from "@/components/ui/sidebar";
import { Badge } from "./ui/badge";
import { useTheme } from "./theme-provider";
import WebsocketContext from "@/contexts/WebsocketContext";

const data = {
  main: {
    name: "DWE OS",
    logoLight: DWELogo,
    logoDark: DWELogoDark,
  },
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: Home,
      isActive: true,
    },
    {
      title: "Cameras",
      url: "/cameras",
      icon: CameraIcon,
    },
    {
      title: "Recordings",
      url: "/recordings",
      icon: VideoIcon,
    },
    {
      title: "Preferences",
      url: "/preferences",
      icon: SettingsIcon,
    },
    {
      title: "Logs",
      url: "/log-viewer",
      icon: LogsIcon,
    },
    {
      title: "Terminal",
      url: "/terminal",
      icon: TerminalIcon,
    },
  ],
};

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

  const theme = useTheme();
  const themeColor = theme.theme === "system" ? systemTheme : theme.theme;

  const { connected } = React.useContext(WebsocketContext)!;

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <div className="flex mt-2 ml-2 items-center gap-2 mb-4 sm:mb-0">
          <div className="flex-shrink-0 flex items-center justify-center w-10">
            <a href="https://dwe.ai" target="_blank">
              <img
                src={
                  themeColor === "dark"
                    ? data.main.logoLight
                    : data.main.logoDark
                }
                alt="Logo"
                className="max-w-full max-h-full object-contain"
              />
            </a>
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* <span className="truncate font-semibold text-sm">
              {data.main.name}
            </span> */}
            <Badge variant="secondary" className="flex-shrink-0">
              v2.0.0
            </Badge>
            {connected ? (
              <Badge variant="success" className="flex-shrink-0">
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex-shrink-0">
                Disconnected
              </Badge>
            )}
          </div>
        </div>
        <NavMain items={data.navMain} />
      </SidebarHeader>
    </Sidebar>
  );
}
