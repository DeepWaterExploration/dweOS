import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { CameraNickname } from "./nickname";
import { CameraStream } from "./stream";
import { proxy, useSnapshot } from "valtio";
import { useContext, useEffect, useState } from "react";
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

  console.log(device);

  // readonly device state
  const deviceState = useSnapshot(device || emptyState);

  if (!device) {
    console.log("Device is null.");
    return <></>;
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>{deviceState.device_info?.device_name}</CardTitle>
        <CardDescription>
          Manufacturer: {deviceState.manufacturer}
          <br />
          USB Port ID: {deviceState.bus_info}
        </CardDescription>
        <CameraNickname />
      </CardHeader>
      <CardContent>
        <CameraStream defaultHost={defaultHost} nextPort={nextPort} />
      </CardContent>
    </Card>
  );
}
