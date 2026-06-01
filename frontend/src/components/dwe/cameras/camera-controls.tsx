// src/components/camera-controls.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

// Import Dialog components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Aperture,
  MonitorCog,
  ImageIcon,
  RotateCcwIcon,
  SlidersHorizontal,
  CircleEllipsis,
  Loader2,
} from "lucide-react";

import IntegerControl from "./controls/integer-control";
import BooleanControl from "./controls/boolean-control";
import MenuControl from "./controls/menu-control";
import { components } from "@/schemas/dwe_os_2";
import { API_CLIENT } from "@/api";
import { toast } from "sonner";
import CameraControlMap from "./cam-control-map.json";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";
import { useDeviceStore } from "@/store/devices";
import { cn } from "@/lib/utils";
import { translateControls, UIControlModel } from "./stream/sensor-controls";

type ControlModel = components["schemas"]["ControlModel"];

const groupIcons: { [key: string]: React.ReactNode } = {
  "Sensor Controls": <Aperture className="h-4 w-4" />,
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
  const key = control.control_id;

  switch (control.flags.control_type) {
    case "INTEGER":
      console.log(control);
      return (
        <IntegerControl
          key={key}
          control={control}
          setValue={setValue}
          disabled={disabled}
        />
      );
    case "BOOLEAN":
      return (
        <BooleanControl
          key={key}
          control={control}
          setValue={setValue}
          disabled={disabled}
        />
      );
    case "MENU":
      return (
        <MenuControl
          key={key}
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

  const InternalControlWrapper = ({ control }: { control: UIControlModel }) => (
    <ControlWrapper
      key={control.control_id}
      control={control}
      disabled={control.uiFlags.disabled || isResetting}
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

  return (
    <div className="grid gap-4 py-4 overflow-y-auto ">
      <Accordion type="single" collapsible>
        {visibleCategories.map(([category, controlNames]) => (
          <AccordionItem value={category} key={category}>
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                {groupIcons[category] ?? <CircleEllipsis className="h-4 w-4" />}
                {category}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 mt-1">
                {controlNames.map(
                  (name) =>
                    uiControls[name] && (
                      <InternalControlWrapper control={uiControls[name]} />
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
