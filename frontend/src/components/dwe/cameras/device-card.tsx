import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDeviceStore } from "@/store/devices";
import { CameraStream } from "./stream/stream";

const DeviceCard = ({ bus_id }: { bus_id: string }) => {
  const device = useDeviceStore((state) => state.devices[bus_id]);

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle>{device.name}</CardTitle>
            <CardDescription>
              Manufacturer: {device.manufacturer}
              <br />
              USB Port ID: {device.bus_info}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CameraStream bus_id={device.bus_info} />
      </CardContent>
    </Card>
  );
};

export default DeviceCard;
