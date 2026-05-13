import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { CameraNickname } from "./nickname";
import { CameraStream } from "./stream";
import { FrameDropIndicator } from "./frame-drop-indicator";
import { proxy, useSnapshot } from "valtio";
import { useContext } from "react";
import DeviceContext from "@/contexts/DeviceContext";

const emptyState = proxy({});

export function CameraCard({
  defaultHost,
  nextPort,
}: {
  defaultHost: string;
  nextPort: number;
}) {
  const device = useContext(DeviceContext)!;

  // readonly device state
  const deviceState = useSnapshot(device || emptyState);

  if (!device) {
    console.log("Device is null.");
    return <></>;
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle>{deviceState.name}</CardTitle>
            <CardDescription>
              Manufacturer: {deviceState.manufacturer}
              <br />
              USB Port ID: {deviceState.bus_info}
            </CardDescription>
          </div>
          <FrameDropIndicator />
        </div>
        <CameraNickname />
      </CardHeader>
      <CardContent>
        <CameraStream defaultHost={defaultHost} nextPort={nextPort} />
      </CardContent>
    </Card>
  );
}
