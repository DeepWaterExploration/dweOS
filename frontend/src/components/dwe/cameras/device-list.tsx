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
import DevicesContext from "@/contexts/DevicesContext";
import { getDeviceByBusInfo } from "@/lib/utils";
import NotConnected from "../not-connected";
import { useToast } from "@/hooks/use-toast";

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

  const { toast } = useToast();

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

  useEffect(() => {
    const getDevices = async () => {
      const initialDevices = (await API_CLIENT.GET("/devices")).data!;

      const newPreferences = (await API_CLIENT.GET("/preferences")).data!;

      if (newPreferences.suggest_host) {
        newPreferences.default_stream!.host = (
          await API_CLIENT.GET("/preferences/get_recommended_host")
        ).data!["host"] as string;
      }

      setSavedPreferences(newPreferences);

      // Update existing devices instead of replacing them
      initialDevices.forEach((device) => {
        addDevice(device);
      });
    };

    const handleDeviceAdded = (device: DeviceModel) => {
      addDevice(device);
    };

    const handleDeviceRemoved = (id: string) => {
      removeDevice(id);
    };

    const handleGstError = (data: { errors: string[]; bus_info: string }) => {
      console.log("GStreamer Error:", data.errors, data.bus_info);
      setDevices((currentDevices) => {
        const device = getDeviceByBusInfo(currentDevices, data.bus_info);
        console.log(currentDevices.map(d => d.bus_info));
        console.log("Device affected by error:", device);
        if (device) {
          device.stream.enabled = false;
        }
        return [...currentDevices]; // Return a new array to trigger re-render
      });
      toast({
        title: "GStreamer Error",
        description: `An error occurred with the device ${data.bus_info}. Please check the logs for more details.`,
        variant: "destructive",
      });
    }

    const getSavedPreferences = async () => { };

    if (connected) {
      socket?.on("gst_error", handleGstError);
      socket?.on("device_added", handleDeviceAdded);
      socket?.on("device_removed", handleDeviceRemoved);

      getDevices();
      getSavedPreferences();
    } else {
      setDevices([]);
    }

    return () => {
      socket?.off("device_added", handleDeviceAdded);
      socket?.off("device_removed", handleDeviceRemoved);
      socket?.off("gst_error", handleGstError);
    };
  }, [socket, connected]);

  const enableStream = (bus_info: string) => {
    const device = { ...getDeviceByBusInfo(devices, bus_info) };
    device.stream.enabled = true;
  };

  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(350px,1fr))]">
      <DevicesContext.Provider
        value={{
          devices,
          followerModels: devices.filter((d) => d.device_type == 2),
          enableStream,
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
