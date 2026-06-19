import { TOUR_STEP_IDS } from "@/components/tour/tour-constants";
import { Spinner } from "@/components/ui/spinner";
import WebsocketContext from "@/contexts/WebsocketContext";
import { useDeviceStore } from "@/store/devices";
import { usePreferencesStore } from "@/store/preferences";
import { CameraOff } from "lucide-react";
import { useContext, useEffect } from "react";
import { useShallow } from "zustand/shallow";
import DeviceCard from "./device-card";

const DeviceListLayout = () => {
  const { socket, connected } = useContext(WebsocketContext)!;
  const fetchPreferences = usePreferencesStore(
    (state) => state.fetchPreferences,
  );

  // Object.keys avoids rerendering everything when one device changes
  const deviceIds = useDeviceStore(
    useShallow((state) => Object.keys(state.devices)),
  );

  const isFetchingDevices = useDeviceStore((state) => state.isFetchingDevices);
  const hasFetchedDevices = useDeviceStore((state) => state.hasFetchedDevices);
  const resetDevices = useDeviceStore((state) => state.reset);
  const fetchDevices = useDeviceStore((state) => state.fetchDevices);

  useEffect(() => {
    if (!connected || !socket) {
      resetDevices();
      return;
    }

    fetchDevices();
    fetchPreferences();

    socket.on("device_added", () => {
      fetchDevices();
    });
    socket.on("device_removed", () => {
      fetchDevices();
    });
    socket.on("device_updated", () => {
      fetchDevices();
    });

    return () => {
      socket.off("device_added");
      socket.off("device_removed");
      socket.off("device_updated");
    };
  }, [connected, socket, fetchDevices, resetDevices, fetchPreferences]);

  return (
    <div className="h-full w-full" data-tour-id={TOUR_STEP_IDS.CAMERAS_PAGE}>
      {!hasFetchedDevices || isFetchingDevices ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 animate-in fade-in">
          <Spinner className="size-8" />
          <p className="text-sm font-medium animate-pulse">
            Scanning for devices...
          </p>
        </div>
      ) : deviceIds.length === 0 ? (
        <div
          data-tour-id={TOUR_STEP_IDS.EMPTY_DEVICE_STATE}
          className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 animate-in fade-in"
        >
          <div className="p-4 bg-muted/50 rounded-full">
            <CameraOff className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-foreground">
              No Cameras Detected
            </p>
            <p className="text-sm">
              Please ensure your devices are properly connected and powered on.
            </p>
            <em className="text-sm animate-pulse">Scanning...</em>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(400px,0fr))]">
          {deviceIds.map((id) => (
            <div key={`${id}`}>
              <DeviceCard bus_id={id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeviceListLayout;
