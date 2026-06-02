import {
  recordingsActions,
  recordingsState,
} from "@/components/dwe/recordings/store/recording-store";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Download } from "lucide-react";
import { useSnapshot } from "valtio";
import {
  formatDate,
  formatFileSize,
  fullName,
  getRecordingStreamUrl,
} from "../utils/recording-utils";

export const RecordingModals = ({ baseUrl }: { baseUrl: string }) => {
  const snap = useSnapshot(recordingsState);

  const renameDisabled =
    !snap.renameValue.trim() ||
    snap.renameSubmitting ||
    (snap.renameTarget !== null &&
      snap.renameValue.trim() === snap.renameTarget.name);

  return (
    <>
      {/* Video Player Dialog */}
      <Dialog
        open={snap.playTarget !== null}
        onOpenChange={(open) => !open && recordingsActions.closePlay()}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-mono break-all">
              {snap.playTarget && fullName(snap.playTarget)}
            </DialogTitle>
            <DialogDescription>
              {snap.playTarget &&
                `${formatDate(snap.playTarget.created)} • ${snap.playTarget.duration} • ${formatFileSize(snap.playTarget.size ? parseFloat(snap.playTarget.size) : 0)}`}
            </DialogDescription>
          </DialogHeader>
          {snap.playTarget && (
            <div className="rounded-md overflow-hidden bg-black">
              <video
                key={snap.playTarget.path}
                src={getRecordingStreamUrl(snap.playTarget, baseUrl)}
                controls
                autoPlay
                className="w-full max-h-[70vh]"
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                snap.playTarget &&
                recordingsActions.downloadRecording(snap.playTarget, baseUrl)
              }
            >
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            <Button onClick={recordingsActions.closePlay}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={snap.renameTarget !== null}
        onOpenChange={(open) => !open && recordingsActions.closeRename()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename recording</DialogTitle>
            <DialogDescription>
              The file extension{" "}
              <span className="font-mono text-foreground">
                .{snap.renameTarget?.format}
              </span>{" "}
              will be preserved.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!renameDisabled) recordingsActions.performRename();
            }}
            className="space-y-3"
          >
            <div className="space-y-2">
              <Label htmlFor="rename-input">New name</Label>
              <div className="flex items-center rounded-md border bg-transparent focus-within:ring-1 focus-within:ring-ring">
                <Input
                  id="rename-input"
                  autoFocus
                  value={snap.renameValue}
                  onChange={(e) =>
                    recordingsActions.setRenameValue(e.target.value)
                  }
                  className="border-0 shadow-none focus-visible:ring-0"
                  placeholder="Enter a new name"
                  disabled={snap.renameSubmitting}
                />
                <span className="px-3 text-sm text-muted-foreground font-mono select-none">
                  .{snap.renameTarget?.format}
                </span>
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={recordingsActions.closeRename}
              disabled={snap.renameSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={recordingsActions.performRename}
              disabled={renameDisabled}
            >
              {snap.renameSubmitting ? "Renaming..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={snap.deleteTargets.length > 0}
        onOpenChange={(open) => !open && recordingsActions.closeDelete()}
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
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={snap.deleteSubmitting}
              onClick={recordingsActions.closeDelete}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                recordingsActions.performDelete();
              }}
              disabled={snap.deleteSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {snap.deleteSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RecordingModals;
