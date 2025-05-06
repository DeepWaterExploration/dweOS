import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useState } from "react";
import { subscribe } from "valtio";
import { components } from "@/schemas/dwe_os_2";

const MenuControl = ({
  control,
}: {
  control: components["schemas"]["ControlModel"];
}) => {
  const [value, setValue] = useState(control.value);
  const menu = control.flags.menu;

  if (!menu) return null;

  subscribe(control, () => {
    setValue(control.value);
  });

  return (
    <div className="space-y-1">
      <span className="text-sm font-medium">{control.name}</span>
      <Select
        value={value.toString()}
        onValueChange={(val) => {
          const intVal = parseInt(val);
          control.value = intVal;
          setValue(intVal);
        }}
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
