import { Toggle } from "@/components/ui/toggle";
import { components } from "@/schemas/dwe_os_2";
import { useState } from "react";
import { subscribe } from "valtio";

const numberToBoolean = (val: number | boolean, VALUE_TRUE: number | boolean) =>
  val === VALUE_TRUE;

const BooleanControl = ({
  control,
}: {
  control: components["schemas"]["ControlModel"];
}) => {
  let VALUE_TRUE: boolean | number = true,
    VALUE_FALSE: boolean | number = false;

  if (control.name == "Auto Exposure") {
    VALUE_TRUE = 3;
    VALUE_FALSE = 1;
  }

  const [value, setValue] = useState(
    numberToBoolean(control.value, VALUE_TRUE),
  );

  subscribe(control, () => {
    setValue(numberToBoolean(control.value, VALUE_TRUE));
  });

  const toggle = () => {
    control.value = control.value === VALUE_TRUE ? VALUE_FALSE : VALUE_TRUE;
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium"></span>
      <Toggle pressed={value} onPressedChange={toggle}>
        <div>{control.name}</div>
      </Toggle>
    </div>
  );
};

export default BooleanControl;
