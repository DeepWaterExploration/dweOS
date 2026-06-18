import { ClockArrowDown } from "lucide-react";
import { useContext, useEffect, useState } from "react";

import { TOUR_STEP_IDS } from "@/components/tour/tour-lib/tour-constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import WebsocketContext from "@/contexts/WebsocketContext";
import { cn } from "@/lib/utils";
import { useDeviceStore } from "@/store/devices";

/**
 * The payload sent over the websocket
 */
type FrameStatsPayload = {
  bus_info: string;
  frame_stats?: { num_drops: number };
};

/**
 * Small indicator that lives in the top-right of the camera card showing the
 * dropped frame count for the device's current stream.
 *
 * The count comes from `device.frame_stats.num_drops`, which the backend
 * resets on every `start_stream`. The proxy is seeded from /api/devices so
 * the count survives a frontend page reload, and updated in-place from
 * `device.frame_stats` socket events for live changes.
 */
export function FrameDropIndicator({ bus_id }: { bus_id: string }) {
  const device = useDeviceStore((state) => state.devices[bus_id]);
  const ws = useContext(WebsocketContext);
  const socket = ws?.socket;
  const connected = ws?.connected ?? false;

  const [frameStats, setFrameStats] = useState(device.frame_stats);

  useEffect(() => {
    if (!device || !connected || !socket) return;

    const onFrameStats = (payload: FrameStatsPayload) => {
      if (
        !payload ||
        payload.bus_info !== device.bus_info ||
        !payload.frame_stats
      )
        return;

      setFrameStats(payload.frame_stats);
    };

    socket.on("device.frame_stats", onFrameStats);
    return () => {
      socket.off("device.frame_stats", onFrameStats);
    };
  }, [device, socket, connected]);

  const total = frameStats?.num_drops ?? 0;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            data-tour-id={TOUR_STEP_IDS.DROPPED_FRAMES}
            className={cn(
              "flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium tabular-nums",
              "border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400",
            )}
            aria-label={`${total} dropped frames this stream`}
          >
            <ClockArrowDown className="h-3 w-3 shrink-0" />
            <span>{total > 9999 ? "9999+" : total}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs text-xs">
          <div className="font-medium">Frame drops</div>
          <div className="mt-1 flex flex-col gap-0.5 text-muted-foreground">
            <div>
              This stream: <span className="text-foreground">{total}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
