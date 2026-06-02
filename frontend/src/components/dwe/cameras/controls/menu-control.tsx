import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { components } from "@/schemas/dwe_os_2";

const MenuControl = ({
  control,
  disabled,
  setValue = undefined,
}: {
  control: components["schemas"]["ControlModel"];
  disabled: boolean;
  setValue?: (val: number) => void;
}) => {
  const [currentValue, setCurrentValue] = useState(control.value);
  const menu = control.flags.menu;

  useEffect(() => {
    setCurrentValue(control.value);
  }, [control.value]);

  if (!menu) return null;
  return (
    <div className="space-y-1">
      <span className="text-sm font-medium">{control.name}</span>
      <Select
        value={currentValue.toString()}
        onValueChange={(val) => {
          const intVal = parseInt(val);
          if (setValue) setValue(intVal);
          setCurrentValue(intVal);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {menu.map((item) => (
            <SelectItem key={item.index} value={item.index.toString()}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MenuControl;
