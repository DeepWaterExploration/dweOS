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
import { SyncDialog } from "./sync-dialog";
import { CameraControls } from "./camera-controls";
import { Button } from "@/components/ui/button";

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
      <CardHeader className="relative">
        <CardTitle>{deviceState.device_info?.device_name}
          <CameraControls className="absolute top-6 right-5" />
        </CardTitle>
        <CardDescription>
          Manufacturer: {deviceState.manufacturer}
          <br />
          USB Port ID: {deviceState.bus_info}
        </CardDescription>
        <CameraNickname />
      </CardHeader>
      <CardContent>
        <Button className="w-full mb-4">Create Stream</Button>
        {/* <CameraStream defaultHost={defaultHost} nextPort={nextPort} /> */}

        <SyncDialog />
      </CardContent>
    </Card>
  );
}
