import { useContext, useEffect } from "react";
import WebsocketContext from "@/contexts/WebsocketContext";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";
import { useDeviceStore } from "@/store/devices";
import DeviceCard from "./device-card";
import { useShallow } from "zustand/shallow";

const DeviceListLayout = () => {
  const { socket, connected } = useContext(WebsocketContext)!;

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

    socket.on("device_added", () => {
      fetchDevices();
    });
    socket.on("device_removed", () => {
      fetchDevices();
    });

    return () => {
      socket.off("device_added");
      socket.off("device_removed");
    };
  }, [connected, socket, fetchDevices, resetDevices]);

  return (
    <div className="h-full w-full" id={TOUR_STEP_IDS.CAMERAS}>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(380px,0fr))]">
        {deviceIds.map((id) => (
          <DeviceCard bus_id={id} key={`${id}`} />
        ))}
      </div>
    </div>
  );
};

export default DeviceListLayout;
