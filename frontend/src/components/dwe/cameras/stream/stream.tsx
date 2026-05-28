import { Button } from "@/components/ui/button";
import { PauseIcon, PlayIcon } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";
import { useDeviceStore } from "@/store/devices";
import { EndpointList } from "./endpoint-list";
import { StreamSelector } from "../stream-selector";
import {
  canLead,
  getAvailableIntervals,
  getEncoders,
  getResolution,
  getResolutions,
  resolutionToString,
} from "@/lib/util/stream";
import { useEffect, useState } from "react";
import { components } from "@/schemas/dwe_os_2";
import { FollowerList } from "./follower-list";
import { CameraControls } from "../camera-controls";

export const CameraStream = ({ bus_id }: { bus_id: string }) => {
  const device = useDeviceStore((state) => state.devices[bus_id]);
  const configureStream = useDeviceStore((state) => state.configureStream);
  const isStreamLoading = useDeviceStore(
    (state) => state.isStreamLoading[bus_id] ?? false,
  );

  const encoders = getEncoders(device);

  const resolutions = getResolutions(device);
  const resolution = resolutionToString(
    device.stream.width,
    device.stream.height,
  );

  const updateIntervals = (newDevice: components["schemas"]["DeviceModel"]) =>
    setAvailableIntervals(getAvailableIntervals(newDevice));

  const [availableIntervals, setAvailableIntervals] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    updateIntervals(device);
    const unsubscribe = useDeviceStore.subscribe(
      (state) => state.devices[bus_id],
      (newDevice) => {
        if (newDevice && newDevice.stream) updateIntervals(newDevice);
      },
    );

    return unsubscribe;
  }, [bus_id, device]);

  return (
    <div className="flex flex-col space-y-4 h-full">
      <Accordion
        type="single"
        collapsible
        defaultValue="stream configuration"
        id={TOUR_STEP_IDS.DEVICE_STREAM_CONFIG}
      >
        <AccordionItem value="stream configuration">
          <AccordionTrigger className="text-sm font-semibold">
            Stream Configuration
          </AccordionTrigger>
          <AccordionContent className="w-full space-y-4">
            {/* Stream configuration */}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <StreamSelector
                  options={resolutions}
                  placeholder="Resolution"
                  label="Resolution"
                  value={resolution}
                  disabled={device.is_managed || isStreamLoading}
                  onChange={(newResolution) => {
                    const [width, height] = getResolution(newResolution);
                    if (!width || !height) {
                      console.error("Invalid resolution selected!");
                      return;
                    }
                    configureStream(device.bus_info, {
                      stream_format: {
                        width,
                        height,
                        interval: device.stream.interval,
                      },
                    });
                  }}
                />
              </div>

              <div className="sm:col-span-3">
                <StreamSelector
                  options={Array.from(availableIntervals)}
                  placeholder="FPS"
                  label="Frame Rate"
                  value={device.stream.interval.denominator.toString()}
                  disabled={device.is_managed || isStreamLoading}
                  onChange={(newFps) => {
                    configureStream(bus_id, {
                      stream_format: {
                        width: device.stream.width,
                        height: device.stream.height,
                        interval: {
                          numerator: 1,
                          denominator: parseInt(newFps),
                        },
                      },
                    });
                  }}
                />
              </div>

              <div className="sm:col-span-4">
                <StreamSelector
                  options={Array.from(encoders)}
                  placeholder="Format"
                  label="Format"
                  value={device.stream.encode_type}
                  disabled={device.is_managed || isStreamLoading}
                  onChange={(fmt) => {
                    configureStream(bus_id, {
                      encode_type:
                        fmt as components["schemas"]["StreamEncodeTypeEnum"],
                    });
                  }}
                />
              </div>
            </div>

            {!device.is_managed && device.stream.stream_type === "UDP" && (
              <EndpointList bus_id={bus_id} />
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {canLead(device) && <FollowerList bus_id={bus_id} />}

      <div className="flex flex-1 justify-between items-center">
        <CameraControls bus_id={bus_id} />
        <div
          className="flex items-center gap-2 pl-2"
          id={TOUR_STEP_IDS.DEVICE_STREAM}
        >
          <Button
            variant={"default"}
            className="w-12 h-12 rounded-full"
            disabled={device.is_managed || isStreamLoading}
            onClick={() => {
              configureStream(device.bus_info, {
                enabled: !device.stream.enabled,
              });
            }}
          >
            {device.stream.enabled ? <PauseIcon /> : <PlayIcon />}
          </Button>
        </div>
      </div>
    </div>
  );
};
