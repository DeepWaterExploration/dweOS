// src/components/camera-controls.tsx (Updated to use Dialog)

import { useContext, useEffect, useState } from "react"; // Added useState
import DeviceContext from "@/contexts/DeviceContext";
import { Button } from "@/components/ui/button";
// Import Dialog components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  // DialogFooter, // Optional: if you want a dedicated footer
} from "@/components/ui/dialog";
import { subscribe } from "valtio";
import {
  Aperture,
  MonitorCog,
  ImageIcon,
  RotateCcwIcon,
  SlidersHorizontal,
  CircleEllipsis,
} from "lucide-react";

import IntegerControl from "./controls/integer-control";
import BooleanControl from "./controls/boolean-control";
import MenuControl from "./controls/menu-control";
import { components } from "@/schemas/dwe_os_2";
import { API_CLIENT } from "@/api";
import { useToast } from "@/hooks/use-toast";
import CameraControlMap from "./cam-control-map.json";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";

type ControlModel = components["schemas"]["ControlModel"];

type GroupedControls = { [key: string]: ControlModel[] };

const ControlWrapper = ({
  control,
  index,
}: {
  control: ControlModel;
  index: number;
}) => {
  const key = control.control_id ?? `control-${index}`;
  const { toast } = useToast();
  const device = useContext(DeviceContext)!;
  const bus_info = device.bus_info;

  const setUVCControl = (
    bus_info: string,
    value: number,
    control_id: number,
  ) => {
    API_CLIENT.POST("/devices/set_uvc_control", {
      body: {
        bus_info,
        control_id,
        value,
      },
    }).catch((error) => {
      console.error("Failed to set UVC control:", control_id, error);
      toast({ title: error, variant: "destructive" });
    });
  };

  // handles disabling associated controls based on another (ie Auto Exposure turns off Exposure Time, Absolute)
  // add any dependency / disabling pairings here
  const dependencyName = control.name.includes("Exposure Time, Absolute")
    ? "Auto Exposure"
    : control.name.includes("White Balance Temperature")
      ? "White Balance, Auto"
      : control.name.includes("Bitrate")
        ? "Variable Bitrate"
        : null;

  const dependencyControl = dependencyName
    ? device.controls.find((c) => c.name.includes(dependencyName))
    : null;

  let isDisabled = false;
  if (dependencyControl) {
    if (control.name.includes("Exposure Time, Absolute")) {
      isDisabled = dependencyControl.value !== 1;
    } else {
      isDisabled = !!dependencyControl.value;
    }
  }

  useEffect(() => {
    const unsub = subscribe(control, () => {
      setUVCControl(bus_info, control.value, control.control_id);
    });
    return () => unsub(); // Clean up on unmount
  }, [control, bus_info]);

  if (
    control.name.includes("Auto Exposure") &&
    control.flags.control_type === "MENU"
  ) {
    control.flags.control_type = "BOOLEAN";
  }

  switch (control.flags.control_type) {
    case "INTEGER":
      return (
        <IntegerControl key={key} control={control} isDisabled={isDisabled} />
      );
    case "BOOLEAN":
      return <BooleanControl key={key} control={control} />;
    case "MENU":
      return <MenuControl key={key} control={control} />;
    default:
      console.warn("Unsupported control type:", control.flags.control_type);
      return null;
  }
};

export const CameraControls = () => {
  const device = useContext(DeviceContext)!;
  const controls = device.controls;
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const resetControls = () => {
    controls.forEach((control) => {
      if (control.value !== control.flags.default_value) {
        control.value = control.flags.default_value;
      }
    });
    toast({ title: "Camera controls reset to default values." });
  };

  const supportedControls = controls.filter((c) =>
    ["INTEGER", "BOOLEAN", "MENU"].includes(c.flags.control_type || ""),
  );

  const getGroupName = (controlName: string) => {
    for (const [groupName, ids] of Object.entries(CameraControlMap)) {
      if (ids.includes(controlName)) {
        return groupName;
      }
    }
    return undefined;
  };

  const getTypeRank = (a: ControlModel, b: ControlModel, order: string[]) => {
    const typeRankA = order.indexOf(a.flags.control_type);
    const typeRankB = order.indexOf(b.flags.control_type);

    if (typeRankA !== typeRankB) {
      return typeRankA - typeRankB;
    }

    return a.name.localeCompare(b.name);
  };

  const groupedControls = supportedControls.reduce<GroupedControls>(
    (acc, control) => {
      const groupName = getGroupName(control.name);

      // We do this so that not every control is displayed.
      if (!groupName) return acc;

      if (!acc[groupName]) {
        acc[groupName] = [];
      }

      acc[groupName].push(control);
      return acc;
    },
    {},
  );
  const typeOrder = ["INTEGER", "MENU"];

  const groupOrder = [
    "Exposure Controls",
    "Image Controls",
    "System Controls",
    "Miscellaneous",
  ];

  const groupIcons: { [key: string]: React.ReactNode } = {
    "Exposure Controls": <Aperture className="h-4 w-4" />,
    "Image Controls": <ImageIcon className="h-4 w-4" />,
    "System Controls": <MonitorCog className="h-4 w-4" />,
    // misc / additional icon is handled in the Accordion
  };

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
          {supportedControls.length > 0 ? (
            <div className="space-y-4">
              {Object.keys(groupedControls)
                .sort((a, b) => groupOrder.indexOf(a) - groupOrder.indexOf(b))
                .map((groupName) => {
                  const booleans = groupedControls[groupName].filter(
                    (c) => c.flags.control_type === "BOOLEAN",
                  );
                  const others = groupedControls[groupName].filter(
                    (c) => c.flags.control_type !== "BOOLEAN",
                  );
                  return (
                    <Accordion type="multiple" key={groupName}>
                      <AccordionItem value={groupName}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            {groupIcons[groupName] || (
                              <CircleEllipsis className="h-4 w-4" />
                            )}
                            {groupName}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {others && (
                            <div className="grid gap-4 mt-1">
                              {others
                                .sort((a, b) => {
                                  return getTypeRank(a, b, typeOrder);
                                })
                                .map((control, index) => (
                                  <ControlWrapper
                                    key={control.control_id ?? index}
                                    control={control}
                                    index={index}
                                  />
                                ))}
                            </div>
                          )}
                          {booleans && (
                            <div className="flex flex-wrap gap-2 m-4 p-2 rounded-xl justify-center">
                              {booleans.map((control, index) => (
                                <ControlWrapper
                                  key={control.control_id ?? index}
                                  control={control}
                                  index={index}
                                />
                              ))}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  );
                })}
            </div>
          ) : (
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
          <RotateCcwIcon className="h-4 w-4" />
          Reset All Controls to Default
        </Button>
      </DialogContent>
    </Dialog>
  );
};
