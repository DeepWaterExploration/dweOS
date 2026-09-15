import { Button } from "@/components/ui/button";
import { Loader2, PauseIcon, PlayIcon, RotateCcw } from "lucide-react";

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
  getEncoders,
  getResolution,
  getResolutions,
  resolutionToString,
} from "@/lib/util/stream";
import { useCallback, useEffect, useState } from "react";
import { components } from "@/schemas/dwe_os_2";
import { CameraControls } from "../camera-controls";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const ScheduleInput = ({
  label,
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    <Input
      key={value}
      type="number"
      defaultValue={value}
      min={min}
      max={max}
      disabled={disabled}
      onBlur={(e) => {
        const newValue = parseInt(e.target.value);
        if (newValue >= min && newValue <= max && newValue !== value)
          onChange(newValue);
        else e.target.value = value.toString();
      }}
    />
  </div>
);

export const CameraStream = ({ bus_id }: { bus_id: string }) => {
  const device = useDeviceStore((state) => state.devices[bus_id]);
  const setUVCControl = useDeviceStore((state) => state.setUVCControl);
  const controls = device.controls;

  const isManaged = device.is_managed || device.is_externally_managed;

  const configureStream = useDeviceStore((state) => state.configureStream);
  const isStreamLoading = useDeviceStore(
    (state) => state.isStreamLoading[bus_id] ?? false,
  );

  const [isResettingControls, setIsResettingControls] = useState(false);

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

  const resetControls = useCallback(() => {
    setIsResettingControls(true);
    Promise.all(
      controls.map((control) =>
        setUVCControl(bus_id, control.control_id, control.flags.default_value),
      ),
    )
      .then(() => {
        toast.info("Successfully reset all controls!");
      })
      .catch(() => {
        toast.error("Unable to reset all controls.");
      })
      .finally(() => {
        setIsResettingControls(false);
      });
  }, [controls, setUVCControl, bus_id]);

  return (
    <div className="flex flex-col space-y-4 h-full">
      <CameraControls bus_id={bus_id} isResetting={isResettingControls} />

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
                  disabled={isManaged || isStreamLoading}
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
                  disabled={isManaged || isStreamLoading}
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
                  disabled={isManaged || isStreamLoading}
                  onChange={(fmt) => {
                    configureStream(bus_id, {
                      encode_type:
                        fmt as components["schemas"]["StreamEncodeTypeEnum"],
                    });
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StreamSelector
                options={["UDP", "RECORDING"]}
                placeholder="Type"
                label="Stream Type"
                value={device.stream.stream_type}
                disabled={isManaged || isStreamLoading}
                onChange={(type) => {
                  configureStream(bus_id, {
                    stream_type: type as components["schemas"]["StreamTypeEnum"],
                  });
                }}
              />
              {device.stream.stream_type === "RECORDING" && (
                <>
                  <ScheduleInput
                    label="Record Every (s)"
                    value={device.stream.record_interval}
                    min={device.stream.record_duration}
                    max={86400}
                    disabled={isManaged || isStreamLoading}
                    onChange={(record_interval) =>
                      configureStream(bus_id, { record_interval })
                    }
                  />
                  <ScheduleInput
                    label="Record For (s)"
                    value={device.stream.record_duration}
                    min={1}
                    max={Math.min(3600, device.stream.record_interval)}
                    disabled={isManaged || isStreamLoading}
                    onChange={(record_duration) =>
                      configureStream(bus_id, { record_duration })
                    }
                  />
                </>
              )}
            </div>

            {!isManaged && device.stream.stream_type === "UDP" && (
              <EndpointList bus_id={bus_id} />
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex items-center justify-between w-full mt-auto pt-4">
        <div id={TOUR_STEP_IDS.DEVICE_SETTINGS}>
          <Button
            variant="svg"
            className="h-12 px-4 flex items-center gap-2 z-10"
            disabled={isResettingControls}
            onClick={resetControls}
          >
            {isResettingControls ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RotateCcw className="s-4" />
            )}
          </Button>
        </div>

        <div id={TOUR_STEP_IDS.DEVICE_STREAM}>
          <Button
            variant={"ghost"}
            className="h-12 px-4 flex items-center gap-2"
            disabled={isManaged || isStreamLoading}
            onClick={() => {
              configureStream(device.bus_info, {
                enabled: !device.stream.enabled,
              });
            }}
          >
            <div>
              <span className="text-sm font-medium">
                {device.is_externally_managed && "Externally "}
                {isManaged
                  ? "Managed"
                  : device.stream.enabled
                    ? "Stop"
                    : "Start"}{" "}
                {device.stream.stream_type === "RECORDING"
                  ? "Recording"
                  : "Stream"}
              </span>
            </div>
            {device.stream.enabled ? <PauseIcon /> : <PlayIcon />}
          </Button>
        </div>
      </div>
    </div>
  );
};
