// src/components/camera-controls.tsx (Updated to use Dialog)

import { useContext, useEffect, useState } from "react"; // Added useState
import DeviceContext from "@/contexts/DeviceContext";
import { Separator } from "@/components/ui/separator";
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
import { RotateCcwIcon } from "lucide-react"; // Added SettingsIcon

import IntegerControl from "./integer-control";
import BooleanControl from "./boolean-control";
import MenuControl from "./menu-control";
import { components } from "@/schemas/dwe_os_2";
import { API_CLIENT } from "@/api";
import { useToast } from "@/hooks/use-toast";

const ControlWrapper = ({
  control,
  index,
}: {
  control: components["schemas"]["ControlModel"];
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
  const bus_info = device.bus_info;
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Camera Controls
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Camera Controls</DialogTitle>
          <DialogDescription>
            Adjust settings for the selected camera. Changes are applied
            immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {supportedControls.length > 0 ? (
            <div className="space-y-4">
              {supportedControls.map((control, index) => (
                <ControlWrapper
                  key={control.control_id ?? index}
                  control={control}
                  index={index}
                />
              ))}
              <Separator className="my-4" />
              <Button
                className="w-full flex items-center gap-2"
                variant="destructive"
                onClick={resetControls}
              >
                <RotateCcwIcon className="h-4 w-4" />
                Reset All Controls to Default
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No adjustable camera controls available for this device.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
