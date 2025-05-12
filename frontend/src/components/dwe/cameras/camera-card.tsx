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
import { Switch } from "@/components/ui/switch";

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

    subscribe(device.stream, () => {});

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
        {deviceState.device_type === 1 ||
          (deviceState.device_type === 2 && <Switch />)}
      </CardContent>
    </Card>
  );
}
