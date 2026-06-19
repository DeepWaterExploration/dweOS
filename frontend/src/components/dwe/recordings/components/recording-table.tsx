import {
  recordingsActions,
  recordingsState,
} from "@/components/dwe/recordings/store/recording-store";
import {
  formatDate,
  formatFileSize,
  isPlayable,
  RecordingInfo,
} from "@/components/dwe/recordings/utils/recording-utils";
import { TOUR_STEP_IDS } from "@/components/tour/tour-constants";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TruncatedTooltip,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSnapshot } from "valtio";

interface TableProps {
  recordings: readonly RecordingInfo[];
  sortColumn: keyof RecordingInfo | null;
  sortDirection: "asc" | "desc" | null;
  onSort: (column: keyof RecordingInfo) => void;
}

export const RecordingTable = ({
  recordings,
  sortColumn,
  sortDirection,
  onSort,
}: TableProps) => {
  const snap = useSnapshot(recordingsState);

  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currX: number;
    currY: number;
  } | null>(null);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const initialSelectionRef = useRef<string[]>([]);
  const isModifierRef = useRef<boolean>(false);
  const [lastIndex, setLastIndex] = useState<number | null>(null);

  const handlePlay = (rec: RecordingInfo) => {
    if (!isPlayable(rec)) {
      toast.info("Format not playable in browser", {
        description: `.${rec.format} files must be downloaded to play.`,
      });
      return;
    }
    recordingsActions.openPlay(rec);
  };

  const handleRowMouseDown = (
    e: React.MouseEvent,
    index: number,
    rec: RecordingInfo,
  ) => {
    if (e.button !== 0) return;

    const isCtrl = e.ctrlKey;
    const isShift = e.shiftKey;
    const isSelected = snap.selectedNames.includes(rec.name);
    let newSelection = [...snap.selectedNames];

    if (isShift && lastIndex !== null) {
      // range definition
      const start = Math.min(lastIndex, index);
      const end = Math.max(lastIndex, index);
      const rangeNames = recordings.slice(start, end + 1).map((r) => r.name);

      if (isCtrl) {
        newSelection = Array.from(new Set([...newSelection, ...rangeNames]));
      } else {
        newSelection = rangeNames;
      }
    } else if (isCtrl) {
      if (isSelected) {
        newSelection = newSelection.filter((n) => n !== rec.name);
      } else {
        newSelection.push(rec.name);
      }
      setLastIndex(index);
    } else {
      newSelection = [rec.name];
      setLastIndex(index);
    }

    recordingsActions.setSelectedNames(newSelection);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;

    if (target.closest("button, .group, input, [role='dialog']")) return;

    setSelectionBox({
      startX: e.clientX,
      startY: e.clientY,
      currX: e.clientX,
      currY: e.clientY,
    });

    isModifierRef.current = e.ctrlKey || e.metaKey || e.shiftKey;

    // clear selections if modifier key not held
    if (!target.closest("tr[data-row-name]") && !isModifierRef.current) {
      recordingsActions.setSelectedNames([]);
      initialSelectionRef.current = [];
    } else {
      initialSelectionRef.current = [...recordingsState.selectedNames];
    }
  };

  // Drag rect
  useEffect(() => {
    if (!selectionBox) return;

    const handlePointerMove = (e: PointerEvent) => {
      setSelectionBox((prev) =>
        prev ? { ...prev, currX: e.clientX, currY: e.clientY } : null,
      );

      if (!tableContainerRef.current) return;

      const dragDist = Math.max(
        Math.abs(e.clientX - selectionBox.startX),
        Math.abs(e.clientY - selectionBox.startY),
      );

      // cancel tiny drags
      if (dragDist < 5) return;

      const boxRect = {
        left: Math.min(selectionBox.startX, e.clientX),
        right: Math.max(selectionBox.startX, e.clientX),
        top: Math.min(selectionBox.startY, e.clientY),
        bottom: Math.max(selectionBox.startY, e.clientY),
      };

      const rows =
        tableContainerRef.current.querySelectorAll("[data-row-name]");
      const boxSelection: string[] = [];

      rows.forEach((row) => {
        const rect = row.getBoundingClientRect();
        // intersection
        if (
          rect.left < boxRect.right &&
          rect.right > boxRect.left &&
          rect.top < boxRect.bottom &&
          rect.bottom > boxRect.top
        ) {
          const name = row.getAttribute("data-row-name");
          if (name) boxSelection.push(name);
        }
      });

      if (isModifierRef.current) {
        recordingsActions.setSelectedNames(
          Array.from(
            new Set([...initialSelectionRef.current, ...boxSelection]),
          ),
        );
      } else {
        recordingsActions.setSelectedNames(boxSelection);
      }
    };

    const handlePointerUp = () => {
      setSelectionBox(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [selectionBox]);

  return (
    <div
      ref={tableContainerRef}
      onPointerDown={handlePointerDown}
      className="h-full w-full relative select-none"
    >
      {selectionBox && (
        <div
          className="fixed border-2 border-primary bg-primary/20 pointer-events-none z-50 rounded-sm"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.currX),
            top: Math.min(selectionBox.startY, selectionBox.currY),
            width: Math.abs(selectionBox.currX - selectionBox.startX),
            height: Math.abs(selectionBox.currY - selectionBox.startY),
          }}
        />
      )}

      <Table noWrapper className="table-fixed">
        <TableHeader
          className="bg-background sticky top-0 z-10 select-none w-full"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <TableRow className="text-left text-gray-500 font-bold">
            <TableCell
              className="cursor-pointer hover:bg-muted w-full"
              onClick={() => onSort("name")}
            >
              Name&nbsp;&nbsp;
              {sortColumn === "name" && (sortDirection === "asc" ? "▲" : "▼")}
            </TableCell>
            <TableCell
              className="cursor-pointer hover:bg-muted w-52"
              onClick={() => onSort("created")}
            >
              Created&nbsp;&nbsp;
              {sortColumn === "created" &&
                (sortDirection === "asc" ? "▲" : "▼")}
            </TableCell>
            <TableCell
              className="cursor-pointer hover:bg-muted w-24"
              onClick={() => onSort("duration")}
            >
              Duration&nbsp;&nbsp;
              {sortColumn === "duration" &&
                (sortDirection === "asc" ? "▲" : "▼")}
            </TableCell>
            <TableCell
              className="cursor-pointer hover:bg-muted w-24"
              onClick={() => onSort("size")}
            >
              Size&nbsp;&nbsp;
              {sortColumn === "size" && (sortDirection === "asc" ? "▲" : "▼")}
            </TableCell>
            <TableCell className="cursor-pointer hover:bg-muted w-12" />
          </TableRow>
        </TableHeader>
        <TableBody className="select-none">
          {recordings.map((recording, index) => {
            const isSelected = snap.selectedNames.includes(recording.name);
            return (
              <TableRow
                key={recording.name}
                data-row-name={recording.name}
                data-tour-id={TOUR_STEP_IDS.RECORDING_ITEM}
                data-state={isSelected ? "selected" : undefined}
                onMouseDown={(e) => handleRowMouseDown(e, index, recording)}
                onDoubleClick={() => handlePlay(recording)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (!isSelected) {
                    recordingsActions.setSelectedNames([recording.name]);
                    setLastIndex(index);
                  }
                  recordingsActions.openContextMenu(
                    recording,
                    e.clientX,
                    e.clientY,
                  );
                }}
                className={cn(
                  "bg-background hover:bg-muted cursor-pointer select-none transition-colors",
                  isSelected ? "bg-accent hover:bg-accent/80" : "",
                )}
              >
                <TableCell className="text-left">
                  <div className="flex items-center gap-2 ">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlay(recording);
                          }}
                          onDoubleClick={(e) => e.stopPropagation()}
                          className="group"
                        >
                          {recording?.format === "mp4" ? (
                            <Eye className="h-8 w-8 border border-background rounded bg-accent text-background p-2 group-hover:text-primary" />
                          ) : (
                            <EyeOff className="h-8 w-8 border border-background rounded bg-muted text-foreground p-2" />
                          )}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {recording?.format === "mp4"
                            ? "Playable in browser"
                            : "Download required to play"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <TruncatedTooltip
                      text={`${recording.name}.${recording.format}`}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  {formatDate(recording.created)}
                </TableCell>
                <TableCell className="text-left">
                  {recording.duration}
                </TableCell>
                <TableCell className="text-left">
                  {formatFileSize(
                    recording.size ? parseFloat(recording.size) : 0,
                  )}
                </TableCell>
                <TableCell className="text-right p-0 pr-2">
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onMouseDown={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      recordingsActions.setSelectedNames([recording.name]);
                      setLastIndex(index);
                      recordingsActions.openContextMenu(
                        recording,
                        rect.left,
                        rect.top,
                      );
                    }}
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreVertical className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
