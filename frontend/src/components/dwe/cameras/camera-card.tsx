import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { CameraNickname } from "./nickname";
import { CameraStream } from "./stream";
import { useSnapshot } from "valtio";
import { useContext } from "react";
import DeviceContext from "@/contexts/DeviceContext";

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
