"use client";

import * as React from "react";
import {
  Home,
  CameraIcon,
  VideotapeIcon,
  SettingsIcon,
  LogsIcon,
} from "lucide-react";

import DWELogo from "@/assets/dwe-logo.svg";
import DWELogoDark from "@/assets/dwe-logo-dark.svg";

import { NavMain } from "@/components/nav-main";
import { Sidebar, SidebarHeader } from "@/components/ui/sidebar";
import { Badge } from "./ui/badge";
import { useTheme } from "./theme-provider";

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
      title: "Recording Browser",
      url: "/videos",
      icon: VideotapeIcon,
    },
    {
      title: "Preferences",
      url: "/preferences",
      icon: SettingsIcon,
    },
    {
      title: "Logs",
      url: "/logs",
      icon: LogsIcon,
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
          </div>
        </div>
        <NavMain items={data.navMain} />
      </SidebarHeader>
    </Sidebar>
  );
}
