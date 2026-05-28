// src/components/camera-controls.tsx

import { useCallback, useEffect, useState } from "react";
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

type ControlModel = components["schemas"]["ControlModel"];

const ControlWrapper = ({
  control,
  index,
  setValue,
  disabled,
}: {
  control: ControlModel;
  index: number;
  setValue: (value: number | boolean) => void;
  disabled: boolean;
}) => {
  const key = control.control_id ?? `control-${index}`;

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

export const CameraControls = ({ bus_id }: { bus_id: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const controls = useDeviceStore((state) => state.devices[bus_id].controls);
  const setUVCControl = useDeviceStore((state) => state.setUVCControl);
  const [isResetting, setIsResetting] = useState(false);

  const resetControls = useCallback(() => {
    setIsResetting(true);
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
        setIsResetting(false);
      });
  }, [controls, setUVCControl, bus_id]);

  console.log(controls);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="svg"
          className="w-6 h-8 z-10"
          id={TOUR_STEP_IDS.DEVICE_SETTINGS}
        >
          <SlidersHorizontal />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="sticky top-0 z-50 pt-8 px-8">
          <DialogTitle>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Camera Controls
            </div>
          </DialogTitle>
          <DialogDescription>
            Adjust settings for the selected camera. Changes are applied
            immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 px-8 overflow-y-auto ">
          <div className="grid gap-4 mt-1">
            {controls.map((control, index) => (
              <ControlWrapper
                key={control.name + index}
                control={control}
                index={index}
                setValue={(value) => {
                  setUVCControl(bus_id, control.control_id, value);
                }}
                disabled={isResetting}
              />
            ))}
          </div>
          {controls.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No adjustable camera controls available for this device.
            </p>
          )}
        </div>
        <Button
          className="mx-4 mt-0 mb-4 flex items-center gap-2 sticky bottom-0"
          variant="destructive"
          onClick={resetControls}
        >
          {isResetting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcwIcon className="h-4 w-4" />
          )}
          Reset All Controls to Default
        </Button>
      </DialogContent>
    </Dialog>
  );
};
