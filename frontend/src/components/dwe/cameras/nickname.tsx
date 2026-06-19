import { TOUR_STEP_IDS } from "@/components/tour/tour-constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeviceStore } from "@/store/devices";
import { Check, Edit2, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export const CameraNickname = ({ bus_id }: { bus_id: string }) => {
  const deviceNickname = useDeviceStore(
    (state) => state.devices[bus_id].nickname,
  );
  const setDeviceNickname = useDeviceStore((state) => state.setNickname);
  const [isEditing, setIsEditing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const saveNickname = useCallback(() => {
    if (inputRef.current) {
      setDeviceNickname(bus_id, inputRef.current.value);
      inputRef.current.blur();
      setIsEditing(false);
    }
  }, [inputRef, setDeviceNickname, bus_id]);

  const startEditing = () => {
    if (inputRef.current) inputRef.current.focus();
  };

  const cancelEditing = () => {
    if (inputRef.current) inputRef.current.blur();
  };

  return (
    <div
      data-tour-id={TOUR_STEP_IDS.DEVICE_NAME}
      className="space-y-2 mb-2 mt-2"
    >
      <div className="flex justify-between items-center w-full">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            ref={inputRef}
            onBlur={saveNickname}
            defaultValue={deviceNickname}
            onFocus={(e) => {
              setIsEditing(true);
              // sets typing cursor to the end of the nickname
              const val = e.target.value;
              e.target.setSelectionRange(val.length, val.length);
            }}
            placeholder="Enter a nickname"
            className={`h-9 bg-background ${isEditing && "border-accent"}`}
          />
          {isEditing ? (
            <div className="flex space-x-1 items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={cancelEditing}
                className="h-9 w-9"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Cancel</span>
              </Button>
              <Button
                variant="default"
                size="icon"
                onClick={saveNickname}
                className="h-8 w-8"
              >
                <Check className="h-4 w-4" />
                <span className="sr-only">Save</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-10 p-0"
              onClick={startEditing}
            >
              <Edit2 />
              <span className="sr-only">Edit nickname</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
