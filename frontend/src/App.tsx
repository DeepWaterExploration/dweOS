import { SidebarLeft } from "@/components/nav/sidebar-left";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Outlet, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/themes/theme-provider";
import { ModeToggle } from "./components/themes/mode-toggle";
import { CommandPalette } from "./components/dwe/app/command-palette";
import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import WebsocketContext from "./contexts/WebsocketContext";
import { Toaster } from "@/components/ui/toaster";
import { WifiDropdown } from "./components/dwe/wireless/wifi-dropdown";
import { WiredDropdown } from "./components/dwe/wireless/wired-dropdown";
import { SystemDropdown } from "./components/dwe/system/system-dropdown";
import { API_CLIENT } from "./api";

function App() {
  const socket = useRef<Socket | undefined>(undefined);
  const [connected, setConnected] = useState(false);
  const [wifiAvailable, setWifiAvailable] = useState(false);

  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case "/":
        return "Home";
      case "/cameras":
        return "Cameras";
      case "/recordings":
        return "Onboard Recordings";
      case "/preferences":
        return "Preferences";
      case "/log-viewer":
        return "Logs";
      case "/terminal":
        return "Terminal";
      default:
        return "";
    }
  };

  const pageTitle = getPageTitle(location.pathname);

  const connectWebsocket = () => {
    if (socket.current) delete socket.current;

    socket.current = io(
      import.meta.env.DEV
        ? `http://${window.location.hostname}:5000`
        : undefined,
      { transports: ["websocket"] }
    );

    socket.current.on("disconnect", () => {
      setConnected(false);
    });

    socket.current.on("connect", () => {
      setConnected(true);
    });
  };

  useEffect(() => {
    if (!connected) {
      connectWebsocket();
    } else {
      //
    }
  }, [connected]);

  useEffect(() => {
    API_CLIENT.GET("/features").then((data) =>
      data.data?.wifi ? setWifiAvailable(true) : setWifiAvailable(false)
    );
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Toaster />
      <WebsocketContext.Provider value={{ socket: socket.current, connected }}>
        <SidebarProvider>
          <SidebarLeft />
          <SidebarInset>
            <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background z-50">
              <div className="flex flex-1 items-center gap-2 px-3">
                <SidebarTrigger />
                <h1 className="text-xl font-bold sm:ml-2 text-nowrap">
                  DWE OS
                </h1>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbPage className="italic text-muted-foreground font-bold">
                        {pageTitle}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <ModeToggle />
                <CommandPalette />
                <WiredDropdown />
                {wifiAvailable ? <WifiDropdown /> : <></>}
                <SystemDropdown />
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4">
              <Outlet />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </WebsocketContext.Provider>
    </ThemeProvider>
  );
}

export default App;
