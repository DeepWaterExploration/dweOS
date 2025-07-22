// src/components/integer-control.tsx (Updated)

import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input"; // Import Input
import { components } from "@/schemas/dwe_os_2";
import { useState, useEffect, useCallback } from "react"; // Import useEffect, useCallback
import { subscribe } from "valtio";
import { Label } from "@/components/ui/label"; // Import Label for better accessibility

const IntegerControl = ({
  control,
}: {
  control: components["schemas"]["ControlModel"];
}) => {
  // Local state for both slider and input interaction
  const [currentValue, setCurrentValue] = useState(control.value);
  // State to hold the potentially invalid input string
  const [inputValue, setInputValue] = useState(control.value.toString());

  const { min_value, max_value, step, default_value } = control.flags;
  const controlId = `control-${control.control_id}-${control.name}`; // Unique ID for label association

  // Update local state when the global control value changes
  useEffect(() => {
    const unsubscribe = subscribe(control, () => {
      // Only update if the external value differs from the current committed value
      if (control.value !== currentValue) {
        setCurrentValue(control.value);
        setInputValue(control.value.toString());
      }
    });
    return () => unsubscribe(); // Cleanup subscription
  }, [control, currentValue]); // Re-subscribe if control or currentValue changes

  // Clamp value within min/max bounds
  const clamp = (val: number): number => {
    return Math.min(max_value, Math.max(min_value, val));
  };

  // Snap value to the nearest valid step
  const snapToStep = (val: number): number => {
    if (step <= 0) return val; // Avoid division by zero or infinite loops
    return Math.round((val - min_value) / step) * step + min_value;
  };

  // Validate and commit the value from input or slider end
  const commitValue = useCallback(
    (newValue: number) => {
      let validatedValue = clamp(newValue);
      validatedValue = snapToStep(validatedValue);

      // Update local state immediately for responsiveness
      setCurrentValue(validatedValue);
      setInputValue(validatedValue.toString());

      // Update the global state only if the value actually changed
      if (control.value !== validatedValue) {
        control.value = validatedValue; // This triggers the API call via subscription in CameraControls
      }
    },
    [control, min_value, max_value, step, clamp, snapToStep] // Dependencies for useCallback
  );

  // Handle changes from the text input
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    setInputValue(rawValue); // Update input display immediately

    // Attempt to parse and validate on change for quick feedback (optional)
    // Or wait for blur/enter for final validation
  };

  // Handle blur event for the text input (commit value)
  const handleInputBlur = () => {
    const parsedValue = parseInt(inputValue, 10);
    if (!isNaN(parsedValue)) {
      commitValue(parsedValue);
    } else {
      // Reset input to the last valid committed value if input is invalid
      setInputValue(currentValue.toString());
    }
  };

  // Handle Enter key press in the text input (commit value)
  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const parsedValue = parseInt(inputValue, 10);
      if (!isNaN(parsedValue)) {
        commitValue(parsedValue);
        // Optionally blur the input after commit
        event.currentTarget.blur();
      } else {
        setInputValue(currentValue.toString());
      }
    } else if (event.key === "Escape") {
      // Reset input to current committed value on Escape
      setInputValue(currentValue.toString());
      event.currentTarget.blur();
    }
  };

  // Handle slider value changes (live update)
  const handleSliderChange = (value: number[]) => {
    const val = value[0];
    // Update visually immediately
    setCurrentValue(val);
    setInputValue(val.toString());
  };

  // Handle slider commit (end of drag)
  const handleSliderCommit = (value: number[]) => {
    commitValue(value[0]);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor={controlId} className="text-sm font-medium truncate">
          {control.name}
        </Label>
        {/* Display current committed value */}
        {/* <span className="text-sm text-muted-foreground">{currentValue}</span> */}
      </div>
      <div className="flex items-center gap-3">
        <Slider
          id={controlId} // Link slider to label
          min={min_value}
          max={max_value}
          step={step}
          value={[currentValue]} // Slider reflects the committed state
          onValueChange={handleSliderChange} // Update local state live
          onValueCommit={handleSliderCommit} // Commit on drag end
          className="flex-grow"
        />
        <Input
          type="number" // Use number type for basic browser validation/keyboard
          value={inputValue} // Input reflects the potentially temporary state
          onChange={handleInputChange}
          onBlur={handleInputBlur} // Commit on blur
          onKeyDown={handleInputKeyDown} // Commit on Enter, reset on Escape
          min={min_value} // Set min/max for browser hints
          max={max_value}
          step={step}
          className="w-20 h-8 text-sm" // Adjust width and height as needed
          // Prevent mouse wheel scrolling from changing the number input value
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
        />
      </div>
    </div>
  );
};

export default IntegerControl;
