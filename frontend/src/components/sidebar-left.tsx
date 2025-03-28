"use client";

import * as React from "react";
import {
  AudioWaveform,
  Blocks,
  Calendar,
  Command,
  Home,
  Icon,
  Inbox,
  MessageCircleQuestion,
  Search,
  ActivityIcon,
  CameraIcon,
  Sparkles,
  Trash2,
  VideoIcon,
  VideotapeIcon,
} from "lucide-react";

import DWELogo from "@/assets/logo-marker.svg";

import { NavFavorites } from "@/components/nav-favorites";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavWorkspaces } from "@/components/nav-workspaces";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "./ui/badge";

const data = {
  main: {
    name: "DWE OS",
    logo: DWELogo,
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
  ],
};

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <img src={data.main.logo} className="w-5 h-5" />
          <span className="truncate font-semibold">{data.main.name}</span>
          <Badge variant="secondary">v0.0.0</Badge>
        </div>
        <NavMain items={data.navMain} />
      </SidebarHeader>
      {/* <SidebarContent>
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent> */}
      {/* <SidebarRail /> */}
    </Sidebar>
  );
}
