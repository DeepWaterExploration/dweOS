// src/components/integer-control.tsx

import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { components } from "@/schemas/dwe_os_2";
import { useState, useEffect, useCallback, useRef } from "react";
import { subscribe } from "valtio";

const IntegerControl = ({
  control,
}: {
  control: components["schemas"]["ControlModel"];
}) => {
  const [currentValue, setCurrentValue] = useState(control.value);
  const [inputValue, setInputValue] = useState(control.value.toString());

  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    startX: number;
    startValue: number;
    containerWidth: number;
  } | null>(null);
  const { min_value, max_value, step } = control.flags;
  const controlId = `control-${control.control_id}-${control.name}`;

  useEffect(() => {
    const unsubscribe = subscribe(control, () => {
      if (control.value !== currentValue) {
        setCurrentValue(control.value);
        setInputValue(control.value.toString());
      }
    });
    return () => unsubscribe();
  }, [control, currentValue]);

  const clamp = (val: number): number => {
    return Math.min(max_value, Math.max(min_value, val));
  };

  // Logic to snap to the specific step defined in flags
  const snapToStep = useCallback(
    (val: number): number => {
      if (!step || step <= 0) return val;
      return Math.round((val - min_value) / step) * step + min_value;
    },
    [min_value, step]
  );

  const commitValue = useCallback(
    (newValue: number) => {
      let validatedValue = clamp(newValue);

      // We enforce the strict 'step' here, at the end of the interaction
      validatedValue = snapToStep(validatedValue);

      setCurrentValue(validatedValue);
      setInputValue(validatedValue.toString());

      if (control.value !== validatedValue) {
        control.value = validatedValue;
      }
    },
    [control, min_value, max_value, clamp, snapToStep]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();

    if (!containerRef.current) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    dragState.current = {
      startX: e.clientX,
      startValue: currentValue,
      containerWidth: containerRef.current.offsetWidth,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return;

    const { startX, startValue, containerWidth } = dragState.current;

    const deltaX = e.clientX - startX;

    const range = max_value - min_value;
    const valueDelta = (deltaX / containerWidth) * range;

    let newValue = clamp(startValue + valueDelta);

    setCurrentValue(newValue);
    setInputValue(Math.round(newValue).toString());
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState.current) return;

    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    dragState.current = null;

    commitValue(currentValue);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleInputBlur = () => {
    const parsedValue = parseInt(inputValue, 10);
    if (!isNaN(parsedValue)) {
      commitValue(parsedValue);
    } else {
      setInputValue(currentValue.toString());
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const parsedValue = parseInt(inputValue, 10);
      if (!isNaN(parsedValue)) {
        commitValue(parsedValue);
        event.currentTarget.blur();
      } else {
        setInputValue(currentValue.toString());
      }
    } else if (event.key === "Escape") {
      setInputValue(currentValue.toString());
      event.currentTarget.blur();
    }
  };

  // // Handle slider live updates
  // const handleSliderChange = (value: number[]) => {
  //   // We allow the "raw" value (step 1) to flow through here for smooth UI
  //   const val = value[0];
  //   setCurrentValue(val);
  //   setInputValue(val.toString());
  // };

  // // Handle slider release (commit)
  // const handleSliderCommit = (value: number[]) => {
  //   // When user lets go, we snap the raw value to the nearest valid step
  //   commitValue(value[0]);
  // };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="relative flex-grow" ref={containerRef}>
          <Slider
            id={controlId}
            min={min_value}
            max={max_value}
            // CHANGE: Set step to 1 (visual smooth drag) instead of control.step (locking)
            step={1}
            value={[currentValue]}
            className="pointer-events-none"
          >
            <span className="text-xs font-bold text-foreground mix-blend-overlay absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              {control.name}
            </span>
          </Slider>
          <div
            className="absolute inset-0 z-10 cursor-ew-resize touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>
        <Input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          min={min_value}
          max={max_value}
          // KEEP: The input box should still respect the logical step for arrow keys
          step={step}
          className="w-20 h-8 text-sm border-border"
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
        />
      </div>
    </div>
  );
};

export default IntegerControl;
