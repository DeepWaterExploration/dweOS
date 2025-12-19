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
import { RotateCcwIcon, SlidersHorizontal } from "lucide-react";

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
    control_id: number
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
      return <IntegerControl key={key} control={control} />;
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
    ["INTEGER", "BOOLEAN", "MENU"].includes(c.flags.control_type || "")
  );

  const getGroupName = (controlName: string) => {
    for (const [groupName, ids] of Object.entries(CameraControlMap)) {
      if (ids.includes(controlName)) {
        return groupName;
      }
    }
    return "Miscellaneous";
  };

  const groupedControls = supportedControls.reduce<GroupedControls>(
    (acc, control) => {
      const groupName = getGroupName(control.name);

      if (!acc[groupName]) {
        acc[groupName] = [];
      }

      acc[groupName].push(control);
      return acc;
    },
    {}
  );

  const order = [
    "Exposure Controls",
    "Image Controls",
    "System Controls",
    "Miscellaneous",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="svg" className="w-6 h-8 z-10">
          <SlidersHorizontal />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col bg-card/30 backdrop-blur p-0 overflow-hidden">
        <DialogHeader className="sticky top-0 z-50 pt-8 px-8">
          <DialogTitle>Camera Controls</DialogTitle>
          <DialogDescription>
            Adjust settings for the selected camera. Changes are applied
            immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 px-8 overflow-y-auto ">
          {supportedControls.length > 0 ? (
            <div className="space-y-4">
              {Object.keys(groupedControls)
                .sort((a, b) => order.indexOf(a) - order.indexOf(b))
                .map((groupName) => (
                  <Accordion type="multiple">
                    <AccordionItem value={groupName}>
                      <AccordionTrigger className=" hover:text-foreground">
                        {groupName}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-4 mt-1">
                          {groupedControls[groupName].map((control, index) => (
                            <ControlWrapper
                              key={control.control_id ?? index}
                              control={control}
                              index={index}
                            />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ))}
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
