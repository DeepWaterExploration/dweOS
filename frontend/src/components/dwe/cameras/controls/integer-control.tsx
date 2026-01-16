// src/components/integer-control.tsx

import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { components } from "@/schemas/dwe_os_2";
import { useState, useEffect, useCallback, useRef } from "react";
import { subscribe } from "valtio";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CirclePlus, CircleMinus } from "lucide-react";

const IntegerControl = ({
  control,
  isDisabled = false,
}: {
  control: components["schemas"]["ControlModel"];
  isDisabled?: boolean;
}) => {
  const { min_value, max_value, step } = control.flags;
  const controlId = `control-${control.control_id}-${control.name}`;
  const safeStep = step && step > 0 ? step : 1;

  const precision =
    safeStep < 1 ? step.toString().split(".")[1]?.length || 0 : 0;

  const [currentValue, setCurrentValue] = useState(control.value);
  const [inputValue, setInputValue] = useState(
    control.value.toFixed(precision).toString()
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const dragState = useRef<{
    startX: number;
    startValue: number;
    containerWidth: number;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe(control, () => {
      if (control.value !== currentValue) {
        setCurrentValue(control.value);
        setInputValue(control.value.toFixed(precision).toString());
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
      return Math.round((val - min_value) / safeStep) * safeStep + min_value;
    },
    [min_value, step]
  );

  const commitValue = useCallback(
    (newValue: number) => {
      let validatedValue = clamp(newValue);

      // We enforce the strict 'step' here, at the end of the interaction
      validatedValue = snapToStep(validatedValue);

      setCurrentValue(validatedValue);
      setInputValue(validatedValue.toFixed(precision).toString());

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
    setInputValue(newValue.toFixed(precision).toString());
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
    const parsedValue = parseFloat(inputValue);
    if (!isNaN(parsedValue)) {
      commitValue(parsedValue);
    } else {
      setInputValue(currentValue.toString());
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const parsedValue = parseFloat(inputValue);
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

  const handleInputStep = (step: string) => {
    if (isDisabled || !inputRef.current) return;

    try {
      if (step === "up") {
        inputRef.current.stepUp();
      } else {
        inputRef.current.stepDown();
      }
    } catch (e) {
      return;
    }

    // stepUp and stepDown don't call on change like the arrow keys do, so we need to update react from the dom
    const newValue = inputRef.current.value;
    setInputValue(newValue);
    setCurrentValue(parseFloat(newValue));

    inputRef.current.focus();
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
    <div
      className={cn(
        "space-y-2",
        isDisabled && "opacity-50 pointer-events-none"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="group relative flex-grow" ref={containerRef}>
          <Slider
            id={controlId}
            min={min_value}
            max={max_value}
            // CHANGE: Set step to 1 (visual smooth drag) instead of control.step (locking)
            step={1}
            value={[currentValue]}
            className="[&>span]:group-hover:border-white pointer-events-none"
            disabled={isDisabled}
          >
            <span className="text-xs font-bold text-foreground mix-blend-overlay absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              {control.name}
            </span>
          </Slider>
          <div
            className="peer absolute inset-0 z-10 cursor-ew-resize touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>
        <div className="flex gap-1">
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
            className="w-20 h-8 text-sm border-border hover:border-foreground"
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            disabled={isDisabled}
            ref={inputRef}
          />
          <div className="flex flex-col gap-[1px]">
            <Button
              variant="svg"
              size="icon"
              className="h-4 w-4 text-border hover:text-foreground"
              onClick={() => handleInputStep("up")}
              disabled={isDisabled || currentValue >= max_value}
              onMouseDown={(e) => e.preventDefault()}
            >
              <CirclePlus className="h-3 w-3 fill-primary/20" />
            </Button>
            <Button
              variant="svg"
              size="icon"
              className="h-4 w-4 text-border hover:text-foreground"
              onClick={() => handleInputStep("down")}
              disabled={isDisabled || currentValue <= min_value}
              onMouseDown={(e) => e.preventDefault()}
            >
              <CircleMinus className="h-3 w-3 fill-primary/20" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegerControl;
