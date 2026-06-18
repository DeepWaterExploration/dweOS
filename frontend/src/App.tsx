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

import { ThemeProvider } from "@/components/themes/theme-provider";
import { TourAlertDialog, TourProvider } from "@/components/tour/tour";
import { useTour } from "@/components/tour/tour-context";
import { TOUR_STEP_IDS } from "@/components/tour/tour-lib/tour-constants";
import { Toaster } from "@/components/ui/sonner";
import { CircleHelpIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { API_CLIENT } from "./api";
import { CommandPalette } from "./components/dwe/app/command-palette";
import { SystemDropdown } from "./components/dwe/system/system-dropdown";
import { ModeToggle } from "./components/themes/mode-toggle";
import FeaturesContext from "./contexts/FeaturesContext";
import WebsocketContext from "./contexts/WebsocketContext";
import { useLogSocketToasts } from "./hooks/use-log-socket-toasts";
import { components } from "./schemas/dwe_os_2";

function AppContent() {
  const [features, setFeatures] = useState<
    components["schemas"]["FeatureSupport"] | undefined
  >(undefined);

  const location = useLocation();

  const { startTour } = useTour();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case "/":
        return "Home";
      case "/cameras":
        return "Cameras";
      case "/recordings":
        return "Onboard Recordings";
      case "/network":
        return "Network";
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

  useLogSocketToasts();

  useEffect(() => {
    API_CLIENT.GET("/api/features").then((data) => {
      if (data.data) setFeatures(data.data);
    });
  }, []);

  return (
    <SidebarProvider>
      <SidebarLeft />
      <SidebarInset>
        <header className="sticky top-0 z-25 flex h-14 shrink-0 items-center gap-2 bg-background">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <h1 className="text-xl font-bold sm:ml-2 text-nowrap">DWE OS</h1>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="italic font-bold text-muted-foreground">
                    {pageTitle}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <ModeToggle />
            <div className="flex items-center ml-auto">
              <button
                data-tour-id={TOUR_STEP_IDS.TOUR_PAGE_BTN}
                onClick={() => startTour(true)}
                className="text-sm text-muted-foreground hover:text-foreground p-2"
                title="Page Tour"
              >
                <CircleHelpIcon className="w-5 h-5" />
              </button>
              <CommandPalette />
              <SystemDropdown />
            </div>
          </div>
        </header>
        <div className="flex flex-col flex-1 gap-4 p-4 overflow-x-hidden">
          <FeaturesContext.Provider value={features}>
            <Outlet />
          </FeaturesContext.Provider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function App() {
  const socket = useRef<Socket | undefined>(undefined);
  const [connected, setConnected] = useState(false);

  const connectWebsocket = () => {
    if (socket.current) {
      socket.current.close();
      delete socket.current;
    }

    socket.current = io(
      import.meta.env.DEV
        ? `http://${window.location.hostname}:5000`
        : undefined,
      { transports: ["websocket"] },
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

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <WebsocketContext.Provider value={{ socket: socket.current, connected }}>
        <TourProvider>
          <AppContent />
          <TourAlertDialog />
        </TourProvider>
      </WebsocketContext.Provider>
      <Toaster richColors />
    </ThemeProvider>
  );
}

export default App;
