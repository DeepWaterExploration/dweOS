import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContext, useEffect, useState } from "react";
import { Check, Edit2, X } from "lucide-react";
import { useSnapshot } from "valtio";
import DeviceContext from "@/contexts/DeviceContext";

export const CameraNickname = () => {
  const device = useContext(DeviceContext);

  // readonly device state
  const deviceState = useSnapshot(device!);

  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(deviceState.nickname);
  const [tempNickname, setTempNickname] = useState(deviceState.nickname);

  const startEditing = () => {
    setTempNickname(nickname);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setTempNickname(nickname);
    setIsEditing(false);
  };

  const saveNickname = () => {
    const trimmedNickname = tempNickname.trim();
    if (trimmedNickname) {
      setNickname(trimmedNickname);
      setIsEditing(false);
    } else {
      setTempNickname(nickname);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    device!.nickname = nickname;
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
      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium leading-none">Camera Nickname</h3>
        <div className="w-8 h-8">
          {" "}
          {/* Maintain a constant spacing to ensure the page does not move up */}
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={startEditing}
              className="h-8 w-8 p-0"
            >
              <Edit2 className="h-4 w-4" />
              <span className="sr-only">Edit nickname</span>
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="flex items-center space-x-2">
          <Input
            value={tempNickname}
            onChange={(e) => setTempNickname(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a nickname"
            className="h-9"
            autoFocus
          />
          <div className="flex space-x-1">
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
              className="h-9 w-9"
            >
              <Check className="h-4 w-4" />
              <span className="sr-only">Save</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-3 py-2 bg-muted/40 rounded-md">
          {nickname ? (
            <p className="text-sm">{nickname}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No nickname set (click edit to add one)
            </p>
          )}
        </div>
      )}
    </div>
  );
};
