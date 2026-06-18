import { TOUR_STEP_IDS } from "@/components/tour/tour-constants";
import WebsocketContext from "@/contexts/WebsocketContext";
import { useDeviceStore } from "@/store/devices";
import { usePreferencesStore } from "@/store/preferences";
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
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(400px,0fr))]">
        {deviceIds.map((id) => (
          <div key={`${id}`}>
            <DeviceCard bus_id={id} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeviceListLayout;
