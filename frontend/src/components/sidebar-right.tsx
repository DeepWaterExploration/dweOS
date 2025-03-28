import { Plus } from "lucide-react";

import { Calendars } from "@/components/calendars";
import { BandwidthViewer } from "@/components/bandwidth-viewer";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { CPUViewer } from "./cpu-viewer";
import { Badge } from "./ui/badge";
import ChartViewer, { ChartData } from "./chart-viewer";
import { useEffect, useState } from "react";
import { getRequest } from "@/lib/utils";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
};

export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [networkData, setNetworkData] = useState([] as ChartData[]);

  return (
    <Sidebar
      collapsible="none"
      className="sticky lg:flex top-0 h-svh border-l"
      {...props}
    >
      <SidebarHeader>
        <Badge variant="outline">Raspberry Pi 4 Model B</Badge>
      </SidebarHeader>
      <SidebarContent className="ml-2 mr-2">
        <ChartViewer
          name="Bandwidth"
          description="Showing total bandwidth in use by the USB bus"
          label="usb"
          unit=" Mbps"
          data={networkData}
        />
        <ChartViewer
          name="CPU Usage"
          description="Showing total usage of the CPU"
          label="cpu"
          unit="%"
          data={networkData}
        />
        <ChartViewer
          name="Network Usage"
          description="Showing total usage of the Network"
          label="network"
          unit=" Mbps"
          data={networkData}
        />
      </SidebarContent>
    </Sidebar>
  );
}
