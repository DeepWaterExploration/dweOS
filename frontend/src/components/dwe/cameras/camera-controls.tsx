// src/components/camera-controls.tsx

import { useMemo } from "react";

import {
  Aperture,
  CircleEllipsis,
  Cog,
  ImageIcon,
  MonitorCog,
} from "lucide-react";

import { TOUR_STEP_IDS } from "@/components/tour/tour-lib/tour-constants";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { components } from "@/schemas/dwe_os_2";
import { useDeviceStore } from "@/store/devices";
import CameraControlMap from "./cam-control-map.json";
import BooleanControl from "./controls/boolean-control";
import IntegerControl from "./controls/integer-control";
import MenuControl from "./controls/menu-control";
import { translateControls, UIControlModel } from "./stream/sensor-controls";

type ControlModel = components["schemas"]["ControlModel"];

const groupIcons: { [key: string]: React.ReactNode } = {
  "Advanced Controls": <Cog className="h-4 w-4" />,
  "System Controls": <MonitorCog className="h-4 w-4" />,
  "Exposure Controls": <Aperture className="h-4 w-4" />,
  "Image Processing": <ImageIcon className="h-4 w-4" />,
};

const groupIDs: { [key: string]: string } = {
  "Advanced Controls": TOUR_STEP_IDS.ADVANCED_CONTROLS,
  "System Controls": TOUR_STEP_IDS.SYSTEM_CONTROLS,
  "Exposure Controls": TOUR_STEP_IDS.EXPOSURE_CONTROLS,
  "Image Processing": TOUR_STEP_IDS.IMAGE_PROCESSING,
};

const ControlWrapper = ({
  control,
  setValue,
  disabled,
}: {
  control: ControlModel;
  setValue: (value: number | boolean) => void;
  disabled: boolean;
}) => {
  switch (control.flags.control_type) {
    case "INTEGER":
      return (
        <IntegerControl
          control={control}
          setValue={setValue}
          disabled={disabled}
        />
      );
    case "BOOLEAN":
      return (
        <BooleanControl
          control={control}
          setValue={setValue}
          disabled={disabled}
        />
      );
    case "MENU":
      return (
        <MenuControl
          control={control}
          setValue={setValue}
          disabled={disabled}
        />
      );
    default:
      console.warn("Unsupported control type:", control.flags.control_type);
      return null;
  }
};

export const CameraControls = ({
  bus_id,
  isResetting,
}: {
  bus_id: string;
  isResetting: boolean;
}) => {
  const device = useDeviceStore((state) => state.devices[bus_id]);
  const controls = device.controls;
  const setUVCControl = useDeviceStore((state) => state.setUVCControl);

  const uiControls = useMemo(
    () => translateControls(controls, device),
    [controls, device],
  );

  const InternalControlWrapper = ({
    control,
    disabled,
  }: {
    control: UIControlModel;
    disabled: boolean;
  }) => (
    <ControlWrapper
      key={control.control_id}
      control={control}
      disabled={control.uiFlags.disabled || isResetting || disabled}
      setValue={(value) => {
        setUVCControl(bus_id, control.control_id, value);
      }}
    />
  );

  const visibleCategories = useMemo(() => {
    return Object.entries(CameraControlMap).filter(([, controlNames]) =>
      controlNames.some((name) => !!uiControls[name]),
    );
  }, [uiControls]);

  if (visibleCategories.length === 0) return null;

  return (
    <div
      className="grid gap-4overflow-y-auto"
      data-tour-id={TOUR_STEP_IDS.DEVICE_SETTINGS}
    >
      <Accordion
        type="single"
        collapsible
        // defaultValue={visibleCategories[0][0]}
      >
        {visibleCategories.map(([category, controlNames]) => (
          <AccordionItem
            value={category}
            key={category}
            data-tour-id={groupIDs[category]}
          >
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                {groupIcons[category] ?? <CircleEllipsis className="h-4 w-4" />}
                {/* FIXME */}
                {device.device_type != 0 && category === "Exposure Controls"
                  ? "Legacy Exposure Controls"
                  : category}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 mt-1">
                {controlNames.map(
                  (name) =>
                    uiControls[name] && (
                      <InternalControlWrapper
                        key={uiControls[name].control_id}
                        control={uiControls[name]}
                        disabled={device.is_managed}
                      />
                    ),
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
