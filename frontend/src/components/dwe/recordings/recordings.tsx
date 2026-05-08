import { API_CLIENT } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { components } from "@/schemas/dwe_os_2";
import { Separator } from "@/components/ui/separator";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Download,
  FolderArchive,
  Pencil,
  Play,
  Trash,
  Video,
  VideoOff,
} from "lucide-react";
import { useTour } from "@/components/tour/tour";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TruncatedTooltip,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

type RecordingInfo = components["schemas"]["RecordingInfo"];

const DEMO_RECORDING: RecordingInfo = {
  path: "",
  name: "Demo Recording",
  format: "mp4",
  duration: "00:00:00",
  size: "0",
  created: new Date().toISOString(),
};

const formatFileSize = (sizeInMB: number): string => {
  if (sizeInMB >= 1024 * 1024) {
    return `${(sizeInMB / (1024 * 1024)).toFixed(2)} TB`;
  } else if (sizeInMB >= 1024) {
    return `${(sizeInMB / 1024).toFixed(2)} GB`;
  } else {
    return `${sizeInMB.toFixed(2)} MB`;
  }
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fullName = (rec: RecordingInfo) => `${rec.name}.${rec.format}`;

const Recordings = () => {
  const hostAddress: string = window.location.hostname;
  const baseUrl = `http://${
    import.meta.env.DEV ? hostAddress + ":5000" : window.location.host
  }`;

  const [recordings, setRecordings] = useState<RecordingInfo[]>([]);

  const [sortColumn, setSortColumn] = useState<keyof RecordingInfo | null>(
    null,
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null,
  );

  const { isActive } = useTour();

  // Rename dialog state
  const [renameTarget, setRenameTarget] = useState<RecordingInfo | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSubmitting, setRenameSubmitting] = useState(false);

  // Delete dialog state (with confirmation guardrail)
  const [deleteTarget, setDeleteTarget] = useState<RecordingInfo | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Video player dialog state
  const [playTarget, setPlayTarget] = useState<RecordingInfo | null>(null);

  // "Download All" zip state
  const [zipDownloading, setZipDownloading] = useState(false);

  const handleSort = (column: keyof RecordingInfo) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const [loading, setLoading] = useState<boolean>(true);

  const [showMenu, setShowMenu] = useState(false);
  const [xPos, setXPos] = useState(0);
  const [yPos, setYPos] = useState(0);
  const [rightClickedRecording, setRightClickedRecording] =
    useState<RecordingInfo | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const closeContextMenu = () => {
    setShowMenu(false);
    setRightClickedRecording(null);
  };

  useEffect(() => {
    const handleInterrupt = (event: Event) => {
      if (event.type == "wheel") {
        closeContextMenu();
        return;
      }

      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeContextMenu();
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleInterrupt);
      document.addEventListener("wheel", handleInterrupt);
      document.addEventListener("keydown", handleInterrupt);
    }
    return () => {
      document.removeEventListener("mousedown", handleInterrupt);
      document.removeEventListener("wheel", handleInterrupt);
      document.removeEventListener("keydown", handleInterrupt);
    };
  }, [showMenu]);

  useLayoutEffect(() => {
    if (showMenu && menuRef.current) {
      const { offsetWidth: menuWidth, offsetHeight: menuHeight } =
        menuRef.current;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = xPos;
      let newY = yPos;

      if (xPos + menuWidth > viewportWidth) {
        newX = xPos - menuWidth;
      }

      if (yPos + menuHeight > viewportHeight) {
        newY = yPos - menuHeight;
      }

      if (newX !== xPos || newY !== yPos) {
        setXPos(newX);
        setYPos(newY);
      }
    }
  }, [showMenu, xPos, yPos]);

  const handleContextMenu = (
    selected: RecordingInfo,
    event: React.MouseEvent<HTMLTableRowElement>,
  ) => {
    event.preventDefault();
    setXPos(event.clientX);
    setYPos(event.clientY);
    setShowMenu(true);
    setRightClickedRecording(selected);
  };

  const isPlayable = (rec: RecordingInfo) => rec.format === "mp4";

  const recordingStreamUrl = (rec: RecordingInfo) =>
    `${baseUrl}/api/recordings/${encodeURIComponent(fullName(rec))}`;

  const downloadRecording = (rec: RecordingInfo) => {
    const link = document.createElement("a");
    link.href = `${recordingStreamUrl(rec)}?download=true`;
    link.download = fullName(rec);
    document.body.appendChild(link);
    link.click();
    link.remove();
    closeContextMenu();
  };

  const openPlayDialog = (rec: RecordingInfo) => {
    if (!isPlayable(rec)) {
      toast.info("Format not playable in browser", {
        description: `.${rec.format} files must be downloaded to play.`,
      });
      closeContextMenu();
      return;
    }
    setPlayTarget(rec);
    closeContextMenu();
  };

  const downloadAllZip = async () => {
    if (zipDownloading) return;
    setZipDownloading(true);
    try {
      const response = await fetch(`${baseUrl}/api/recordings/zip`);
      if (!response.ok) {
        let description = `Server responded with ${response.status}.`;
        try {
          const data = await response.json();
          if (data?.detail) description = data.detail;
        } catch {
          // non-JSON error body; keep default description
        }
        toast.error("Failed to download recordings", { description });
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "recordings.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading recordings zip:", error);
      toast.error("Failed to download recordings", {
        description: "Please check the logs for more details.",
      });
    } finally {
      setZipDownloading(false);
    }
  };

  const openRenameDialog = (rec: RecordingInfo) => {
    setRenameTarget(rec);
    setRenameValue(rec.name);
    closeContextMenu();
  };

  const openDeleteDialog = (rec: RecordingInfo) => {
    setDeleteTarget(rec);
    setDeleteConfirmText("");
    closeContextMenu();
  };

  const performRename = async () => {
    if (!renameTarget) return;
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === renameTarget.name) {
      setRenameTarget(null);
      return;
    }
    setRenameSubmitting(true);
    try {
      const result = await API_CLIENT.PATCH(
        "/api/recordings/{old_name}/{new_name}",
        {
          params: {
            path: {
              old_name: fullName(renameTarget),
              new_name: `${trimmed}.${renameTarget.format}`,
            },
          },
        },
      );
      const newRecs = result.data as RecordingInfo[] | undefined;
      if (newRecs) {
        setRecordings(newRecs);
        toast.success("Recording renamed", {
          description: `"${renameTarget.name}" → "${trimmed}"`,
        });
      }
      setRenameTarget(null);
    } catch (error) {
      console.error("Error renaming recording:", error);
      toast.error("Failed to rename recording", {
        description: "Please check the logs for more details.",
      });
    } finally {
      setRenameSubmitting(false);
    }
  };

  const performDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      const result = await API_CLIENT.DELETE(
        "/api/recordings/{recording_path}",
        {
          params: {
            path: { recording_path: fullName(deleteTarget) },
          },
        },
      );
      const newRecs = result.data as RecordingInfo[] | undefined;
      if (newRecs) {
        setRecordings(newRecs);
        toast.success("Recording deleted", {
          description: fullName(deleteTarget),
        });
      }
      setDeleteTarget(null);
      setDeleteConfirmText("");
    } catch (error) {
      console.error("Error deleting recording:", error);
      toast.error("Failed to delete recording", {
        description: "Please check the logs for more details.",
      });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  useEffect(() => {
    API_CLIENT.GET("/api/recordings")
      .then((data) => setRecordings(data.data!))
      .catch((error) => console.error("Error fetching recordings:", error))
      .finally(() => setLoading(false));
  }, []);

  const displayRecordings = useMemo(() => {
    const data = isActive ? [DEMO_RECORDING] : recordings;
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let valA: any = a[sortColumn];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let valB: any = b[sortColumn];

      if (sortColumn === "size") {
        valA = parseFloat(valA || "0");
        valB = parseFloat(valB || "0");
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [recordings, sortColumn, sortDirection, isActive]);

  const deleteConfirmMatches =
    deleteTarget !== null && deleteConfirmText.trim() === deleteTarget.name;

  const renameDisabled =
    !renameValue.trim() ||
    renameSubmitting ||
    (renameTarget !== null && renameValue.trim() === renameTarget.name);

  return (
    <div
      className="flex flex-col h-[calc(100vh-5.5rem)]"
      id={TOUR_STEP_IDS.REC_PAGE}
    >
      <div className="flex min-h-0 flex-1">
        {showMenu && rightClickedRecording && (
          <div
            style={{ left: xPos, top: yPos }}
            className="fixed min-w-56 max-w-80 bg-popover/30 backdrop-blur border rounded-lg shadow-lg z-50 text-sm p-1 overflow-hidden"
            ref={menuRef}
          >
            <div className="px-3 py-2 truncate text-xs text-muted-foreground font-mono">
              {fullName(rightClickedRecording)}
            </div>
            <Separator className="my-1" />
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-inherit"
              onClick={() => openPlayDialog(rightClickedRecording)}
              disabled={!isPlayable(rightClickedRecording)}
              title={
                isPlayable(rightClickedRecording)
                  ? undefined
                  : `.${rightClickedRecording.format} is not playable in the browser`
              }
            >
              <Play className="h-4 w-4" />
              Play
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors text-left"
              onClick={() => downloadRecording(rightClickedRecording)}
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors text-left"
              onClick={() => openRenameDialog(rightClickedRecording)}
            >
              <Pencil className="h-4 w-4" />
              Rename
            </button>
            <Separator className="my-1" />
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-destructive/90 hover:text-destructive-foreground text-destructive rounded-sm transition-colors text-left"
              onClick={() => openDeleteDialog(rightClickedRecording)}
            >
              <Trash className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}

        <div className="flex-1 min-w-0 overflow-x-auto border rounded-xl">
          {loading ? (
            <div className="flex items-center justify-center h-full w-full">
              Loading...
            </div>
          ) : (
            <Table noWrapper className="table-fixed">
              <TableHeader className="bg-background sticky top-0 z-10">
                <TableRow className="text-left text-gray-500 font-bold">
                  <TableCell
                    className="cursor-pointer hover:bg-muted w-auto"
                    onClick={() => handleSort("name")}
                  >
                    Name&nbsp;&nbsp;
                    {sortColumn === "name" &&
                      (sortDirection === "asc" ? "▲" : "▼")}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer hover:bg-muted w-52"
                    onClick={() => handleSort("created")}
                  >
                    Created&nbsp;&nbsp;
                    {sortColumn === "created" &&
                      (sortDirection === "asc" ? "▲" : "▼")}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer hover:bg-muted w-24"
                    onClick={() => handleSort("duration")}
                  >
                    Duration&nbsp;&nbsp;
                    {sortColumn === "duration" &&
                      (sortDirection === "asc" ? "▲" : "▼")}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer hover:bg-muted w-24"
                    onClick={() => handleSort("size")}
                  >
                    Size&nbsp;&nbsp;
                    {sortColumn === "size" &&
                      (sortDirection === "asc" ? "▲" : "▼")}
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {displayRecordings.map((recording) => (
                  <TableRow
                    key={recording.name}
                    id={TOUR_STEP_IDS.DEMO_RECORDING}
                    onContextMenu={(e) => handleContextMenu(recording, e)}
                    onDoubleClick={() => openPlayDialog(recording)}
                    className="bg-background hover:bg-muted cursor-pointer select-none"
                  >
                    <TableCell className="text-left">
                      <div className="flex items-center gap-2 ">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              {recording?.format === "mp4" ? (
                                <Video className="h-8 w-8 border border-background rounded bg-accent text-background p-2" />
                              ) : (
                                <VideoOff className="h-8 w-8 border border-background rounded bg-muted text-foreground p-2" />
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
                    <TableCell className="text-left w-24">
                      {formatDate(recording.created)}
                    </TableCell>
                    <TableCell className="text-left w-24">
                      {recording.duration}
                    </TableCell>
                    <TableCell className="text-left w-24">
                      {formatFileSize(
                        recording.size ? parseFloat(recording.size) : 0,
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <div
        className="bg-background p-4 mt-auto"
        id={TOUR_STEP_IDS.RECORDING_FOOTER}
      >
        <div className="flex justify-between items-center max-w-full gap-2">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={downloadAllZip}
            disabled={zipDownloading || recordings.length === 0}
          >
            <FolderArchive />
            {zipDownloading ? "Preparing..." : "Download All"}
          </Button>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span>
              Total Recordings:{" "}
              <span className="text-foreground font-medium">
                {recordings.length}
              </span>
            </span>
            <span>
              Total Size:{" "}
              <span className="text-foreground font-medium">
                {formatFileSize(
                  recordings.reduce(
                    (acc, rec) => acc + (rec.size ? parseFloat(rec.size) : 0),
                    0,
                  ),
                )}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Video Player Dialog */}
      <Dialog
        open={playTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPlayTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-mono break-all">
              {playTarget && fullName(playTarget)}
            </DialogTitle>
            <DialogDescription>
              {playTarget &&
                `${formatDate(playTarget.created)} • ${
                  playTarget.duration
                } • ${formatFileSize(
                  playTarget.size ? parseFloat(playTarget.size) : 0,
                )}`}
            </DialogDescription>
          </DialogHeader>
          {playTarget && (
            <div className="rounded-md overflow-hidden bg-black">
              <video
                key={playTarget.path}
                src={recordingStreamUrl(playTarget)}
                controls
                autoPlay
                className="w-full max-h-[70vh]"
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => playTarget && downloadRecording(playTarget)}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button onClick={() => setPlayTarget(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open && !renameSubmitting) setRenameTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename recording</DialogTitle>
            <DialogDescription>
              The file extension{" "}
              <span className="font-mono text-foreground">
                .{renameTarget?.format}
              </span>{" "}
              will be preserved.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!renameDisabled) performRename();
            }}
            className="space-y-3"
          >
            <div className="space-y-2">
              <Label htmlFor="rename-input">New name</Label>
              <div className="flex items-center rounded-md border bg-transparent focus-within:ring-1 focus-within:ring-ring">
                <Input
                  id="rename-input"
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="border-0 shadow-none focus-visible:ring-0"
                  placeholder="Enter a new name"
                  disabled={renameSubmitting}
                />
                <span className="px-3 text-sm text-muted-foreground font-mono select-none">
                  .{renameTarget?.format}
                </span>
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameTarget(null)}
              disabled={renameSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={performRename} disabled={renameDisabled}>
              {renameSubmitting ? "Renaming..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation AlertDialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteSubmitting) {
            setDeleteTarget(null);
            setDeleteConfirmText("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <AlertDialogTitle>Delete recording?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Type{" "}
                <span className="text-foreground font-mono">
                  {deleteTarget?.name}
                </span>{" "}
                to confirm
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={deleteTarget?.name}
                autoComplete="off"
                disabled={deleteSubmitting}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                performDelete();
              }}
              disabled={!deleteConfirmMatches || deleteSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Recordings;
