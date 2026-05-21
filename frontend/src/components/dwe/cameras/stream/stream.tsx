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
  getAvailableIntervals,
  getResolution,
  getResolutions,
  resolutionToString,
} from "@/lib/util/stream";
import { useEffect, useState } from "react";
import { components } from "@/schemas/dwe_os_2";

export const CameraStream = ({ bus_id }: { bus_id: string }) => {
  const device = useDeviceStore((state) => state.devices[bus_id]);
  const configureStream = useDeviceStore((state) => state.configureStream);

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

  useDeviceStore.subscribe(
    (state) => state.devices[bus_id],
    (newDevice) => {
      if (newDevice && newDevice.stream) updateIntervals(newDevice);
    },
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
    <div className="space-y-4">
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
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <StreamSelector
                  options={resolutions}
                  placeholder="Resolution"
                  label="Resolution"
                  value={resolution}
                  disabled={device.is_managed}
                  onChange={(newResolution) => {
                    const [width, height] = getResolution(newResolution);
                    if (!width || !height) return;
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
                  disabled={device.is_managed}
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

              {/*<div className="sm:col-span-4">
                <StreamSelector
                  options={encoders.map((e) => ({ label: e, value: e }))}
                  placeholder="Format"
                  label="Format"
                  value={format}
                  // disabled={deviceState.is_managed}
                  onChange={(fmt) => {
                    setFormat(
                      fmt as components["schemas"]["StreamEncodeTypeEnum"],
                    );
                    setShouldPostFlag(true);
                  }}
                />
              </div>*/}
            </div>
            {!device.is_managed && device.stream.stream_type === "UDP" && (
              <EndpointList bus_id={bus_id} />
            )}

            {/* TODO: Manage this logic in backend too */}
            {/*{!deviceState.is_managed && (
              <Button
                className="w-full"
                onClick={() => {
                  device.stream.stream_type =
                    device.stream.stream_type === "RECORDING"
                      ? "UDP"
                      : "RECORDING";
                  setShouldPostFlag(true);
                }}
                id={TOUR_STEP_IDS.DEVICE_MODE}
              >
                Switch to{" "}
                {device.stream.stream_type === "RECORDING"
                  ? "Stream"
                  : "Recording"}{" "}
                mode
              </Button>
            )}*/}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/*{(device.device_type == 1 ||
        (device.device_type === 2 && !device.is_managed)) && <FollowerList />}*/}
      <div className="flex flex-1 justify-between items-center">
        <div
          className="flex items-center gap-2 pl-2"
          id={TOUR_STEP_IDS.DEVICE_STREAM}
        >
          <div>
            <span className="text-sm font-medium">
              {device.is_managed
                ? "Managed"
                : device.stream.enabled
                  ? "Stop"
                  : "Start"}
            </span>
          </div>
          <Button
            variant={"default"}
            className="w-12 h-12 rounded-full"
            disabled={device.is_managed}
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
