import { API_CLIENT } from "@/api";
import { CameraCard } from "./camera-card";
import { useContext, useEffect, useState } from "react";
import type { components } from "@/schemas/dwe_os_2";
import WebsocketContext from "@/contexts/WebsocketContext";
import { proxy, subscribe } from "valtio";
import DeviceContext from "@/contexts/DeviceContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DeviceModel = components["schemas"]["DeviceModel"];

const NoDevicesConnected = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>No Devices Connected</CardTitle>
          <CardDescription>
            Please make sure your devices are plugged in and accessible by DWE
            OS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <section className="space-y-4">
            <h3 className="font-semibold text-lg">Potential Issues</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Power:</strong> If you are using a powered USB Hub, you
                must provide power.
              </li>
            </ul>
          </section>
        </CardContent>
        <CardFooter>
          For more detailed documentation, refer to our docs.
        </CardFooter>
      </Card>
    </div>
  );
};

const DeviceListLayout = () => {
  const { socket, connected } = useContext(WebsocketContext)!;

  const [devices, setDevices] = useState([] as DeviceModel[]);

  const [savedPreferences, setSavedPreferences] = useState({
    default_stream: { port: 5600, host: "192.168.2.1" },
  } as components["schemas"]["SavedPreferencesModel"]);

  const [nextPort, setNextPort] = useState(5600);

  const getNextPort = (devs = devices) => {
    const allPorts: number[] = [];
    devs.forEach((device) => {
      device.stream.endpoints.forEach((endpoint) =>
        allPorts.push(endpoint.port)
      );
    });
    return allPorts.length > 0
      ? allPorts.sort().reverse()[0] + 1
      : savedPreferences.default_stream!.port; // return the highest port
  };

  const createDeviceProxy = (device: DeviceModel) => {
    const proxyDevice = proxy(device);

    subscribe(proxyDevice, () => {
      let maxPort = nextPort;
      proxyDevice.stream.endpoints.forEach((e) => {
        if (e.port >= maxPort) {
          maxPort = e.port + 1;
        }
      });
      setNextPort(maxPort);
    });

    return proxyDevice;
  };

  const addDevice = (device: DeviceModel) => {
    const proxiedDevice = createDeviceProxy(device);
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
      const initialDevices = (await API_CLIENT.GET("/devices")).data!;

      const newPreferences = (await API_CLIENT.GET("/preferences")).data!;

      if (newPreferences.suggest_host) {
        newPreferences.default_stream!.host = (
          await API_CLIENT.GET("/preferences/get_recommended_host")
        ).data!["host"] as string;
      }

      // Get the initial next port
      setNextPort(getNextPort(initialDevices));

      setSavedPreferences(newPreferences);
      setDevices(initialDevices.map((d) => createDeviceProxy(d)));
    };

    const handleDeviceAdded = (device: DeviceModel) => {
      addDevice(device);
    };

    const handleDeviceRemoved = (id: string) => {
      removeDevice(id);
    };

    const getSavedPreferences = async () => {};

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
      {devices.length === 0 && <NoDevicesConnected />}
    </div>
  );
};

export default DeviceListLayout;
