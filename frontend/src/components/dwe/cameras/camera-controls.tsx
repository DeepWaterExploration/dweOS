// src/components/camera-controls.tsx

import { useMemo } from "react";

import {
  Aperture,
  MonitorCog,
  ImageIcon,
  CircleEllipsis,
  Cog,
} from "lucide-react";

import IntegerControl from "./controls/integer-control";
import BooleanControl from "./controls/boolean-control";
import MenuControl from "./controls/menu-control";
import { components } from "@/schemas/dwe_os_2";
import CameraControlMap from "./cam-control-map.json";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useDeviceStore } from "@/store/devices";
import { translateControls, UIControlModel } from "./stream/sensor-controls";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";

type ControlModel = components["schemas"]["ControlModel"];

const groupIcons: { [key: string]: React.ReactNode } = {
  "Sensor Controls": <Cog className="h-4 w-4" />,
  "Exposure Controls": <Aperture className="h-4 w-4" />,
  "Image Controls": <ImageIcon className="h-4 w-4" />,
  "System Controls": <MonitorCog className="h-4 w-4" />,
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
      className="grid gap-4 py-4 overflow-y-auto"
      id={TOUR_STEP_IDS.DEVICE_SETTINGS}
    >
      <Accordion
        type="single"
        collapsible
        defaultValue={visibleCategories[0][0]}
      >
        {visibleCategories.map(([category, controlNames]) => (
          <AccordionItem value={category} key={category}>
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
                        // NOTE: External management behavior is changed after v0.7.3 to account for SDK v1.2.0 changes
                        // This means versions AFTER v0.7.3 will no longer work as intended with SDK versions before v1.2.0
                        disabled={device.is_managed || device.is_externally_managed}
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
