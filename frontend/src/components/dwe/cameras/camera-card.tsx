import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { CameraNickname } from "./nickname";
import { CameraStream } from "./stream";
import { subscribe, useSnapshot } from "valtio";
import { useContext, useEffect } from "react";
import DeviceContext from "@/contexts/DeviceContext";
import { API_CLIENT } from "@/api";

export function CameraCard({
  defaultHost,
  nextPort,
}: {
  defaultHost: string;
  nextPort: number;
}) {
  const device = useContext(DeviceContext)!;

  // readonly device state
  const deviceState = useSnapshot(device);

  useEffect(() => {
    const unsubscribe = subscribe(device, () => {});

    subscribe(device.stream, () => {
      if (device.stream.configured) {
      } else {
        // API_CLIENT.POST("/devices/unconfigure_stream", {
        //   body: { bus_info: device.bus_info },
        // });
      }
    });

    return () => unsubscribe();
  }, [device]);

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>{deviceState.device_info?.device_name}</CardTitle>
        <CardDescription>
          Manufacturer: {deviceState.manufacturer}
          <br />
          USB Port ID: {deviceState.bus_info}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CameraNickname />
        <CameraStream defaultHost={defaultHost} nextPort={nextPort} />
      </CardContent>
    </Card>
  );
}
