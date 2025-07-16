import { API_CLIENT } from "@/api";
import { CameraCard } from "./camera-card";
import { useContext, useEffect, useState, useRef } from "react";
import type { components } from "@/schemas/dwe_os_2";
import WebsocketContext from "@/contexts/WebsocketContext";
import { proxy, snapshot, subscribe } from "valtio";
import DeviceContext from "@/contexts/DeviceContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DevicesContext from "@/contexts/DevicesContext";
import NotConnected from "../not-connected";

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

  const getNextPort = (devs: DeviceModel[]) => {
    const allPorts = devs.flatMap((device) =>
      device.stream.endpoints.map((endpoint) => endpoint.port)
    );
    return allPorts.length > 0
      ? Math.max(...allPorts) + 1
      : savedPreferences.default_stream!.port;
  };

  const createDeviceProxy = (device: DeviceModel) => {
    const proxyDevice = proxy(device);

    subscribe(proxyDevice, () => {
      setDevices((prevDevices) => {
        const updatedDevices = prevDevices.map((d) =>
          d.bus_info === proxyDevice.bus_info ? proxyDevice : d
        );
        setNextPort(getNextPort(updatedDevices));
        return updatedDevices;
      });
    });

    return proxyDevice;
  };

  const addDevice = (device: DeviceModel) => {
    setDevices((prevDevices) => {
      const exists = prevDevices.some((d) => d.bus_info === device.bus_info);
      if (exists) {
        const updatedDevices = prevDevices.map((d) =>
          d.bus_info === device.bus_info ? device : d
        );
        setNextPort(getNextPort(updatedDevices));
        return updatedDevices;
      } else {
        const newDevices = [...prevDevices, createDeviceProxy(device)];
        setNextPort(getNextPort(newDevices));
        return newDevices;
      }
    });
  };

  const removeDevice = (bus_info: string) => {
    setDevices((prevDevices) => {
      const filteredDevices = prevDevices.filter(
        (d) => d.bus_info !== bus_info
      );
      setNextPort(getNextPort(filteredDevices));
      return filteredDevices;
    });
  };
  const updateDevice = (bus_info: string, updatedData: Partial<DeviceModel>) => {
    setDevices((prevDevices) => {
      const deviceIndex = prevDevices.findIndex((d) => d.bus_info === bus_info);
      if (deviceIndex === -1) return prevDevices; // Device not found

      const updatedDevice = {
        ...prevDevices[deviceIndex],
        ...updatedData,
      };

      const newDevices = [...prevDevices];
      newDevices[deviceIndex] = createDeviceProxy(updatedDevice);
      setNextPort(getNextPort(newDevices));
      return newDevices;
    });
  };

  const setDevicesProvider = (devices: DeviceModel[]) => {
    setDevices((prevDevices) => {
      // Update existing proxy devices or create new ones
      const updatedDevices = devices.map((device) => {

        return createDeviceProxy(device);

      });

      setNextPort(getNextPort(updatedDevices));
      return updatedDevices;
    });
  }
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

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
      setDevicesProvider(initialDevices);
    };


    const handleDeviceAdded = (device: DeviceModel) => {
      addDevice(device);
    };

    const handleDeviceRemoved = (id: string) => {
      removeDevice(id);
    };

    const getSavedPreferences = async () => { };

    if (connected) {
      socket?.on("device_added", handleDeviceAdded);
      socket?.on("device_removed", handleDeviceRemoved);

      getDevices();
      getSavedPreferences();

      // Start polling for device updates
      intervalId = setInterval(getDevices, 5000);
    } else {
      setDevices([]);
    }

    return () => {
      socket?.off("device_added", handleDeviceAdded);
      socket?.off("device_removed", handleDeviceRemoved);

      // Clean up the interval
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [socket, connected]);

  const enableStream = (bus_info: string) => {
    setDevices((prevDevices) => {
      return prevDevices.map((device) => {
        if (device.bus_info === bus_info) {
          const updatedDevice = { ...device };
          updatedDevice.stream.enabled = true;
          return updatedDevice;
        }
        return device;
      });
    });
  };


  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(350px,1fr))]">
      <DevicesContext.Provider
        value={{
          devices,
          followerModels: devices.filter((d) => d.device_type == 2),
          enableStream,
          setDevices: setDevicesProvider,
        }}
      >
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
        {devices.length === 0 &&
          (connected ? <NoDevicesConnected /> : <NotConnected />)}
      </DevicesContext.Provider>
    </div>
  );
};

export default DeviceListLayout;
