import { Toggle } from "@/components/ui/toggle";
import { components } from "@/schemas/dwe_os_2";
import { useEffect, useState } from "react";

const numberToBoolean = (val: number | boolean, VALUE_TRUE: number | boolean) =>
  val === VALUE_TRUE;

const BooleanControl = ({
  control,
  disabled,
  setValue = undefined,
}: {
  control: components["schemas"]["ControlModel"];
  disabled: boolean;
  setValue?: (value: boolean) => void;
}) => {
  const VALUE_TRUE: boolean | number = true,
    VALUE_FALSE: boolean | number = false;

  const [currentValue, setCurrentValue] = useState(
    numberToBoolean(control.value, VALUE_TRUE),
  );

  const toggle = () => {
    const newValue = currentValue === VALUE_TRUE ? VALUE_FALSE : VALUE_TRUE;
    setCurrentValue(newValue);
    if (setValue) setValue(newValue);
  };

  useEffect(() => {
    setCurrentValue(control.value === VALUE_TRUE);
  }, [control.value, VALUE_TRUE]);

  return (
    <div className={"flex justify-center p-2"}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium"></span>
        <Toggle
          pressed={currentValue === VALUE_TRUE}
          onPressedChange={toggle}
          disabled={disabled}
        >
          <div>{control.name}</div>
        </Toggle>
      </div>
    </div>
  );
};

export default BooleanControl;
