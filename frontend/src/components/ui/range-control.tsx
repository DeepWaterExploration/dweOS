import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CirclePlus, CircleMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface RangeControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export const RangeControl = ({
  label,
  value,
  min,
  max,
  onChange,
  step = 1,
  disabled = false,
  className,
}: RangeControlProps) => {
  const [valueSlider, setValueSlider] = useState(value)
  // Local state for input to allow typing
  const [inputValue, setInputValue] = useState(value.toString());

  // Sync input when prop value changes (e.g. from slider drag)
  useEffect(() => {
    setInputValue(valueSlider.toString());
  }, [valueSlider]);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const clamped = Math.min(Math.max(num, min), max);
      
      setValueSlider(valueSlider);
      onChange(clamped);
    }
  };

  useEffect(() => {
    if (valueSlider > max) {
      setValueSlider(max)
    }
  }, [max])

  const handleStep = (direction: 1 | -1) => {
    const newValue = Math.min(Math.max(value + direction * step, min), max);
      setValueSlider(newValue);
    onChange(newValue);
  };

  return (
    <div
      className={cn(
        "space-y-2",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {/* Slider Section */}
        <div className="group relative flex-grow">
          <Slider
            value={[valueSlider]}
            min={min}
            max={max}
            step={step}
            onValueChange={(vals) => {
              setValueSlider(vals[0])
              onChange(vals[0])
            }}
            disabled={disabled}
            className="[&>span]:group-hover:border-white cursor-pointer"
          >
            {/* Overlay Label */}
            <span className="text-xs font-bold text-foreground absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              {label}
            </span>
          </Slider>
        </div>

        {/* Input & Buttons Section */}
        <div className="flex gap-1 shrink-0">
          <Input
            type="number"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            min={min}
            max={max}
            step={step}
            className="w-20 h-8 text-sm border-border hover:border-foreground"
            disabled={disabled}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
          />
          <div className="flex flex-col gap-[1px]">
            <Button
              variant="svg"
              size="icon"
              className="h-4 w-4 text-border hover:text-foreground"
              onClick={() => handleStep(1)}
              disabled={disabled || value >= max}
              onMouseDown={(e) => e.preventDefault()}
            >
              <CirclePlus className="h-3 w-3 fill-primary/20" />
            </Button>
            <Button
              variant="svg"
              size="icon"
              className="h-4 w-4 text-border hover:text-foreground"
              onClick={() => handleStep(-1)}
              disabled={disabled || value <= min}
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
