"use client";

import * as React from "react";
import { Home, CameraIcon, VideotapeIcon } from "lucide-react";

import DWELogo from "@/assets/dwe-logo.svg";

import { NavMain } from "@/components/nav-main";
import { Sidebar, SidebarHeader } from "@/components/ui/sidebar";
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
        <div className="flex mt-2 ml-2 items-center gap-2 mb-4 sm:mb-0">
          <div className="flex-shrink-0 flex items-center justify-center w-10">
            <a href="https://dwe.ai" target="_blank">
              <img
                src={data.main.logo}
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
