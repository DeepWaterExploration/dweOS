import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDeviceStore } from "@/store/devices";
import { CameraStream } from "./stream/stream";
import { CameraNickname } from "./nickname";
import { FrameDropIndicator } from "./frame-drop-indicator";

const DeviceCard = ({ bus_id }: { bus_id: string }) => {
  const deviceName = useDeviceStore((state) => state.devices[bus_id].name);
  const deviceManufacturer = useDeviceStore(
    (state) => state.devices[bus_id].manufacturer,
  );

  return (
    <Card className="w-full max-w-[600px] mx-auto">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle>{deviceName}</CardTitle>
            <CardDescription>
              Manufacturer: {deviceManufacturer}
              <br />
              USB Port ID: {bus_id}
            </CardDescription>
          </div>
          <FrameDropIndicator bus_id={bus_id} />
        </div>
        <CameraNickname bus_id={bus_id} />
      </CardHeader>
      <CardContent>
        <CameraStream bus_id={bus_id} />
      </CardContent>
    </Card>
  );
};

export default DeviceCard;
