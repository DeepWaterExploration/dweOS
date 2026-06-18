import { TOUR_STEP_IDS } from "@/components/tour/tour-constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDeviceStore } from "@/store/devices";
import { FrameDropIndicator } from "./frame-drop-indicator";
import { CameraNickname } from "./nickname";
import { CameraStream } from "./stream/stream";

const DeviceCard = ({ bus_id }: { bus_id: string }) => {
  const deviceName = useDeviceStore((state) => state.devices[bus_id].name);
  const deviceManufacturer = useDeviceStore(
    (state) => state.devices[bus_id].manufacturer,
  );
  const string3 = useDeviceStore((state) => state.devices[bus_id].string3);

  return (
    <Card
      className="w-full max-w-[600px] mx-auto"
      data-tour-id={TOUR_STEP_IDS.CAMERA_DEVICE}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle>{deviceName}</CardTitle>
            <CardDescription>
              {deviceManufacturer} &#8226; {bus_id}
              <br />
              {string3.length > 0 && (
                <Tooltip>
                  <TooltipTrigger>Firmware String: {string3}</TooltipTrigger>
                  <TooltipContent>
                    The firmware parameter for the device.
                    <br />
                    If this is visible, it means your device is running
                    specialized firmware.
                  </TooltipContent>
                </Tooltip>
              )}
            </CardDescription>
          </div>
          <FrameDropIndicator bus_id={bus_id} />
        </div>
        <div className="mt-1">
          <CameraNickname bus_id={bus_id} />
        </div>
      </CardHeader>
      <CardContent>
        <CameraStream bus_id={bus_id} />
      </CardContent>
    </Card>
  );
};

export default DeviceCard;
