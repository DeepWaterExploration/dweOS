import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContext, useEffect, useRef, useState } from "react";
import { Check, Edit2, X } from "lucide-react";
import { useSnapshot } from "valtio";
import DeviceContext from "@/contexts/DeviceContext";
import { API_CLIENT } from "@/api";

export const CameraNickname = () => {
  const device = useContext(DeviceContext)!;

  // readonly device state
  const deviceState = useSnapshot(device!);

  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(deviceState.nickname);
  const [tempNickname, setTempNickname] = useState(deviceState.nickname);

  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    setTempNickname(nickname);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelEditing = () => {
    setTempNickname(nickname);
    setIsEditing(false);
    inputRef.current?.blur();
  };

  const saveNickname = () => {
    const trimmedNickname = tempNickname.trim();
    setNickname(trimmedNickname);
    setIsEditing(false);
    inputRef.current?.blur();

    API_CLIENT.POST("/devices/set_nickname", {
      body: { bus_info: device.bus_info, nickname: trimmedNickname },
    });
  };

  useEffect(() => {
    device.nickname = nickname;
  }, [nickname]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      saveNickname();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  return (
    <div className="space-y-2 mb-4">
      <div className="flex justify-between items-center w-full">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            ref={inputRef}
            value={tempNickname}
            onChange={(e) => setTempNickname(e.target.value)}
            onFocus={(e) => {
              setIsEditing(true);
              // sets typing cursor to the end of the nickname
              const val = e.target.value;
              e.target.setSelectionRange(val.length, val.length);
            }}
            onKeyDown={handleKeyDown}
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
              onClick={startEditing}
              className="h-8 w-10 p-0"
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
