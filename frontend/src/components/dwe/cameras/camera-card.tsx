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
import type { components } from "@/schemas/dwe_os_2";
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
  const deviceState = useSnapshot(device!);

  useEffect(() => {
    const unsubscribe = subscribe(device!, () => {});

    subscribe(device, () => {
      API_CLIENT.POST("/devices/set_nickname", {
        body: { bus_info: device.bus_info, nickname: device.nickname },
      });
    });

    subscribe(device.stream, () => {
      if (device.stream.configured) {
        API_CLIENT.POST("/devices/configure_stream", {
          body: {
            bus_info: device.bus_info,
            encode_type: device.stream.encode_type,
            endpoints: device.stream.endpoints,
            stream_format: {
              width: device.stream.width,
              height: device.stream.height,
              interval: device.stream.interval,
            },
          },
        });
      } else {
        API_CLIENT.POST("/devices/unconfigure_stream", {
          body: { bus_info: device.bus_info },
        });
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
