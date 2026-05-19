import {
  recordingsActions,
  recordingsState,
} from "@/components/dwe/recordings/store/recording-store";
import {
  fullName,
  isPlayable,
} from "@/components/dwe/recordings/utils/recording-utils";
import { Separator } from "@/components/ui/separator";
import { Download, Pencil, Play, Trash } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSnapshot } from "valtio";

export const RecordingContextMenu = ({ baseUrl }: { baseUrl: string }) => {
  const snap = useSnapshot(recordingsState);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Local state strictly for the edge-detection math
  const [adjustedX, setAdjustedX] = useState(0);
  const [adjustedY, setAdjustedY] = useState(0);

  // Handle global click-away / scroll-away
  useEffect(() => {
    const handleInterrupt = (event: Event) => {
      if (event.type === "wheel") {
        recordingsActions.closeContextMenu();
        return;
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        recordingsActions.closeContextMenu();
      }
    };

    if (snap.contextMenu.isOpen) {
      document.addEventListener("mousedown", handleInterrupt);
      document.addEventListener("wheel", handleInterrupt);
      document.addEventListener("keydown", handleInterrupt);
    }
    return () => {
      document.removeEventListener("mousedown", handleInterrupt);
      document.removeEventListener("wheel", handleInterrupt);
      document.removeEventListener("keydown", handleInterrupt);
    };
  }, [snap.contextMenu.isOpen]);

  // Handle screen edge collisions
  useLayoutEffect(() => {
    if (snap.contextMenu.isOpen && menuRef.current) {
      const { offsetWidth: menuWidth, offsetHeight: menuHeight } =
        menuRef.current;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = snap.contextMenu.x;
      let newY = snap.contextMenu.y;

      if (newX + menuWidth > viewportWidth) newX = newX - menuWidth;
      if (newY + menuHeight > viewportHeight) newY = newY - menuHeight;

      setAdjustedX(newX);
      setAdjustedY(newY);
    }
  }, [snap.contextMenu.isOpen, snap.contextMenu.x, snap.contextMenu.y]);

  if (!snap.contextMenu.isOpen || !snap.contextMenu.target) return null;

  const target = snap.contextMenu.target;
  const playable = isPlayable(target);
  const isBulk = snap.selectedNames.length > 1;
  const selectedRecs = snap.recordings.filter((r) =>
    snap.selectedNames.includes(r.name),
  );

  const handlePlay = () => {
    recordingsActions.closeContextMenu();
    if (!playable) {
      toast.info("Format not playable in browser", {
        description: `.${target.format} files must be downloaded to play.`,
      });
      return;
    }
    recordingsActions.openPlay(target);
  };

  const handleDownload = () => {
    recordingsActions.closeContextMenu();
    if (isBulk) {
      recordingsActions.downloadZip(baseUrl);
    } else {
      recordingsActions.downloadRecording(target, baseUrl);
    }
  };

  const handleRename = () => {
    recordingsActions.closeContextMenu();
    recordingsActions.openRename(target);
  };

  const handleDelete = () => {
    recordingsActions.closeContextMenu();
    recordingsActions.openDelete(isBulk ? selectedRecs : [target]);
  };

  return (
    <div
      ref={menuRef}
      style={{ left: adjustedX, top: adjustedY }}
      className="fixed min-w-56 max-w-80 bg-popover/30 backdrop-blur border rounded-lg shadow-lg z-50 text-sm p-1 overflow-hidden"
      onContextMenu={(e) => e.preventDefault()} // Prevent native menu if right-clicking *inside* our menu
    >
      <div className="px-3 py-2 truncate text-xs text-muted-foreground font-mono">
        {fullName(target)}
      </div>
      <Separator className="my-1" />

      <button
        type="button"
        onClick={handlePlay}
        disabled={!playable || isBulk}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-inherit"
      >
        <Play className="h-4 w-4" /> Play
      </button>

      <button
        type="button"
        onClick={handleDownload}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors text-left"
      >
        <Download className="h-4 w-4" />{" "}
        {isBulk
          ? `Download Selected (${snap.selectedNames.length})`
          : "Download"}
      </button>

      <button
        type="button"
        onClick={handleRename}
        disabled={isBulk}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-inherit"
      >
        <Pencil className="h-4 w-4" /> Rename
      </button>

      <Separator className="my-1" />

      <button
        type="button"
        onClick={handleDelete}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-destructive/90 hover:text-destructive-foreground text-destructive rounded-sm transition-colors text-left"
      >
        <Trash className="h-4 w-4" />{" "}
        {isBulk ? `Delete Selected (${snap.selectedNames.length})` : "Delete"}
      </button>
    </div>
  );
};
