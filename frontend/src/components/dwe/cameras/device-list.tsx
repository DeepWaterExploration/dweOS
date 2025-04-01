import { API_CLIENT } from "@/api";
import { CameraCard } from "./camera-card";
import { useContext, useEffect, useState } from "react";
import type { components } from "@/schemas/dwe_os_2";
import WebsocketContext from "@/contexts/WebsocketContext";
import { proxy, subscribe } from "valtio";
import DeviceContext from "@/contexts/DeviceContext";

type DeviceModel = components["schemas"]["DeviceModel"];

const DeviceListLayout = () => {
  const { socket, connected } = useContext(WebsocketContext)!;

  const [devices, setDevices] = useState([] as DeviceModel[]);

  const [savedPreferences, setSavedPreferences] = useState({
    default_stream: { port: 5600, host: "192.168.2.1" },
  } as components["schemas"]["SavedPreferencesModel"]);

  const [nextPort, setNextPort] = useState(5600);

  const addDevice = (device: DeviceModel) => {
    const proxiedDevice = proxy(device);
    setDevices((prevDevices) => {
      const exists = prevDevices.some(
        (d) => d.bus_info === proxiedDevice.bus_info
      );

      if (exists) {
        updateDevice(device);
      } else {
        return [...prevDevices, proxiedDevice];
      }

      return prevDevices;
    });
  };

  const updateDevice = (updatedDevice: DeviceModel) => {
    setDevices((prevDevices) => {
      const index = prevDevices.findIndex(
        (d) => d.bus_info === updatedDevice.bus_info
      );
      if (index !== -1) {
        prevDevices[index] = updatedDevice;
      }
      return prevDevices;
    });
  };

  const removeDevice = (bus_info: string) => {
    setDevices((prevDevices) => {
      prevDevices = prevDevices.filter((d) => d.bus_info !== bus_info);
      return prevDevices;
    });
  };

  useEffect(() => {
    const getDevices = async () => {
      setDevices((await API_CLIENT.GET("/devices")).data!.map((d) => proxy(d)));
    };

    const handleDeviceAdded = (device: DeviceModel) => {
      addDevice(device);
    };

    const handleDeviceRemoved = (id: string) => {
      removeDevice(id);
    };

    const getSavedPreferences = async () => {
      const newPreferences = (await API_CLIENT.GET("/preferences")).data!;
      if (newPreferences.suggest_host) {
        newPreferences.default_stream!.host = (
          await API_CLIENT.GET("/preferences/get_recommended_host")
        ).data!["host"] as string;
      }

      setSavedPreferences(newPreferences);
    };

    if (connected) {
      socket?.on("device_added", handleDeviceAdded);
      socket?.on("device_removed", handleDeviceRemoved);

      getDevices();
      getSavedPreferences();
    }
    return () => {
      socket?.off("device_added", handleDeviceAdded);
      socket?.off("device_removed", handleDeviceRemoved);
    };
  }, [socket, connected]);

  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(350px,1fr))]">
      {devices.map((device, index) => (
        <div key={`${device.bus_info}-${index}`}>
          <DeviceContext.Provider value={device}>
            <CameraCard
              defaultHost={savedPreferences.default_stream!.host}
              nextPort={nextPort}
            />
          </DeviceContext.Provider>
        </div>
      ))}
    </div>
  );
};

export default DeviceListLayout;
