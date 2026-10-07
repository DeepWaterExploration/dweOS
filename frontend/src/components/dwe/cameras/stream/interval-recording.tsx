import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useDeviceStore } from "@/store/devices";
import { useEffect, useState } from "react";

export const IntervalRecording = ({
  bus_id,
  disabled,
  onChange,
}: {
  bus_id: string;
    disabled: boolean;
    onChange: (recording_interval: number, recording_length: number) => void;
}) => {
  const isStreamLoading = useDeviceStore(
    (state) => state.isStreamLoading[bus_id] ?? false,
  );

  const [enabled, setEnabled] = useState(true);
  const [intervalMinutes, setIntervalMinutes] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(1);

  const isDisabled = disabled || isStreamLoading;
  const isValid =
    intervalMinutes > 0 &&
    durationMinutes > 0 &&
    durationMinutes < intervalMinutes;

  const parseMinutes = (value: string) => Math.max(0, parseInt(value) || 0);

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="interval recording">
        <AccordionTrigger className="text-sm font-semibold">
          Interval Recording
        </AccordionTrigger>
        <AccordionContent className="w-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {/*<Label
                htmlFor={`interval-recording-${bus_id}`}
                className="text-sm"
              >
                Enable interval recording
              </Label>*/}
              {/*<Switch
                id={`interval-recording-${bus_id}`}
                checked={enabled}
                onCheckedChange={setEnabled}
                disabled={isDisabled}
              />*/}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Every (minutes)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={intervalMinutes}
                  disabled={isDisabled || !enabled}
                  onChange={(e) =>
                    setIntervalMinutes(parseMinutes(e.target.value))
                  }
                  onBlur={() => onChange(intervalMinutes, durationMinutes)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Record for (minutes)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={durationMinutes}
                  disabled={isDisabled || !enabled}
                  onChange={(e) =>
                    setDurationMinutes(parseMinutes(e.target.value))
                  }
                  onBlur={() => onChange(intervalMinutes, durationMinutes)}
                />
              </div>
            </div>

            {isValid ? (
              <div className="text-sm text-muted-foreground p-4 rounded-md bg-muted/50">
                Records for {durationMinutes} minute
                {durationMinutes === 1 ? "" : "s"} every {intervalMinutes}{" "}
                minute{intervalMinutes === 1 ? "" : "s"}.
              </div>
            ) : (
              <div className="text-sm text-destructive p-4 rounded-md bg-destructive/10">
                Recording duration must be greater than 0 and shorter than the
                interval.
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
