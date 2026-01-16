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
import { TourAlertDialog, TourProvider, useTour } from "@/components/tour/tour";
import { getSteps } from "./components/tour/tour-steps";
import FeaturesContext from "./contexts/FeaturesContext";
import { components } from "./schemas/dwe_os_2";

type WelcomeTourProps = { features: components["schemas"]["FeatureSupport"] };
function WelcomeTourManager(props: WelcomeTourProps) {
  const [openTour, setOpenTour] = useState(false);
  const { setSteps } = useTour();

  useEffect(() => {
    setSteps(getSteps(props.features));
    const timer = setTimeout(() => {
      setOpenTour(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [setSteps, props.features]);

  return <TourAlertDialog isOpen={openTour} setIsOpen={setOpenTour} />;
}

function AppContent() {
  const [features, setFeatures] = useState<
    components["schemas"]["FeatureSupport"] | undefined
  >(undefined);

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

  useEffect(() => {
    API_CLIENT.GET("/features").then((data) => {
      if (data.data) setFeatures(data.data);
    });
  }, []);

  return (
    <SidebarProvider>
      <SidebarLeft />
      <SidebarInset>
        <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background z-50">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <h1 className="text-xl font-bold sm:ml-2 text-nowrap">DWE OS</h1>
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
            <div className="ml-auto flex items-center">
              <CommandPalette />
              {features?.wifi ? <WiredDropdown /> : <></>}
              {features?.wifi ? <WifiDropdown /> : <></>}
              <SystemDropdown />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 overflow-x-hidden">
          <FeaturesContext.Provider value={features}>
            <Outlet />
          </FeaturesContext.Provider>
        </div>
      </SidebarInset>
      {features && <WelcomeTourManager features={features} />}
    </SidebarProvider>
  );
}

function App() {
  const socket = useRef<Socket | undefined>(undefined);
  const [connected, setConnected] = useState(false);

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

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Toaster />
      <WebsocketContext.Provider value={{ socket: socket.current, connected }}>
        <TourProvider>
          <AppContent />
        </TourProvider>
      </WebsocketContext.Provider>
    </ThemeProvider>
  );
}

export default App;
