import { RecordingContextMenu } from "@/components/dwe/recordings/components/recording-context-menu";
import RecordingModals from "@/components/dwe/recordings/components/recording-modals";
import { RecordingTable } from "@/components/dwe/recordings/components/recording-table";
import {
  recordingsActions,
  recordingsState,
} from "@/components/dwe/recordings/store/recording-store";
import { TOUR_STEP_IDS } from "@/components/tour/tour-lib/tour-constants";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { components } from "@/schemas/dwe_os_2";
import { ChevronDown, Circle, Download, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSnapshot } from "valtio";

type RecordingInfo = components["schemas"]["RecordingInfo"];

const Recordings = () => {
  const hostAddress: string = window.location.hostname;
  const baseUrl = `http://${
    import.meta.env.DEV ? hostAddress + ":5000" : window.location.host
  }`;
  const snap = useSnapshot(recordingsState);

  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof RecordingInfo | null>(
    null,
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null,
  );

  // initial data fetch
  useEffect(() => {
    recordingsActions.fetchRecordings();
  }, []);

  // global listener for clicks outside of table
  useEffect(() => {
    const handleGlobalPointerDown = (e: PointerEvent) => {
      if (recordingsState.selectedNames.length === 0) return;

      const target = e.target as HTMLElement;

      if (
        // ignore clicks inside the table
        target.closest(
          'tr, thead, [role="row"], [role="columnheader"], .rt-tr',
        ) ||
        // ignore clicks inside context menus/modals
        target.closest(
          '[role="menu"], [role="dialog"], [data-radix-popper-content-wrapper]',
        ) ||
        // ignore clicks on action buttons inside recordings
        (target.closest("button, input, a") &&
          containerRef.current?.contains(target))
      ) {
        return;
      }
      recordingsActions.setSelectedNames([]);
    };

    document.addEventListener("pointerdown", handleGlobalPointerDown);
    return () =>
      document.removeEventListener("pointerdown", handleGlobalPointerDown);
  }, []);

  const handleSort = (column: keyof RecordingInfo) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const displayRecordings = useMemo(() => {
    let data = snap.recordings;

    // searching
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(
        (rec) =>
          rec.name.toLowerCase().includes(lowerQuery) ||
          rec.format.toLowerCase().includes(lowerQuery),
      );
    }

    // sorting
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
  }, [snap.recordings, sortColumn, sortDirection, searchQuery]);

  const disk = snap.diskStats;

  // MB to Bytes
  const recordingsSizeBytes = snap.recordings.reduce(
    (acc, rec) => acc + (rec.size ? parseFloat(rec.size) * 1024 * 1024 : 0),
    0,
  );

  // disk stats fallback
  const totalBytes = disk?.total || 1;
  const freeBytes = disk?.free || 0;
  const otherUsedBytes = Math.max((disk?.used || 0) - recordingsSizeBytes, 0);

  // calculate percentages of each
  const recordingsPct = (recordingsSizeBytes / totalBytes) * 100;
  const otherPct = (otherUsedBytes / totalBytes) * 100;
  const freePct = (freeBytes / totalBytes) * 100;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 GB";
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1
      ? `${gb.toFixed(1)} GB`
      : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-[calc(100vh-5.5rem)] gap-2"
      data-tour-id={TOUR_STEP_IDS.RECORDING_PAGE}
    >
      <div className="relative w-full">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search recordings..."
          className="pl-8 bg-background w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex-1 min-w-0 overflow-x-auto border rounded-md">
          <RecordingTable
            recordings={displayRecordings}
            loading={snap.loading}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </div>
      </div>

      <div
        className="bg-background p-4 mt-auto"
        data-tour-id={TOUR_STEP_IDS.RECORDING_FOOTER}
      >
        <div className="flex justify-between items-center max-w-full gap-6 p-1">
          {/* BUTTONS */}
          <div
            className="shrink-0"
            data-tour-id={TOUR_STEP_IDS.RECORDINGS_FUNCTIONS}
          >
            {snap.selectedNames.length > 0 ? (
              <div className="flex gap-4 items-center">
                <ButtonGroup>
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => {
                      if (snap.selectedNames.length > 1) {
                        recordingsActions.downloadZip(baseUrl);
                      } else if (snap.selectedNames.length === 1) {
                        const targetRecording = snap.recordings.find(
                          (r) => r.name === snap.selectedNames[0],
                        );
                        if (targetRecording) {
                          recordingsActions.downloadRecording(
                            targetRecording,
                            baseUrl,
                          );
                          recordingsActions.setSelectedNames([]);
                        }
                      }
                    }}
                  >
                    <Download className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="cursor-pointer hover:bg-destructive"
                    disabled={
                      snap.deleteSubmitting || snap.recordings.length === 0
                    }
                    onClick={() => {
                      const selectedRecs = snap.recordings.filter((r) =>
                        snap.selectedNames.includes(r.name),
                      );
                      recordingsActions.openDelete(
                        (snap.selectedNames.length > 0
                          ? selectedRecs
                          : snap.recordings) as RecordingInfo[],
                      );
                    }}
                  >
                    {snap.deleteSubmitting ? (
                      <div className="flex items-center gap-2">
                        Trashing <Spinner className="size-4" />
                      </div>
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </ButtonGroup>
                <div className="flex bg-muted items-center border px-2 gap-2  rounded-md">
                  <span className="text-sm text-muted-foreground">
                    {snap.selectedNames.length} selected
                  </span>
                  <Button
                    variant="svg"
                    className="p-0 h-8"
                    onClick={() => recordingsActions.setSelectedNames([])}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  const allNames = snap.recordings.map((r) => r.name);
                  recordingsActions.setSelectedNames(allNames);
                }}
              >
                Select All
              </Button>
            )}
          </div>

          {/* STORAGE BAR */}
          <div
            className="flex-1 max-w-md flex flex-col gap-2 ml-auto"
            data-tour-id={TOUR_STEP_IDS.STORAGE_BAR}
          >
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex">
              {/* Recordings */}
              <div
                className="h-full bg-primary transition-all duration-700 ease-out"
                style={{ width: `${recordingsPct}%` }}
                title={`Recordings: ${formatBytes(recordingsSizeBytes)}`}
              />
              {/* Other Files */}
              <div
                className="h-full bg-muted-foreground/20 transition-all duration-700 ease-out"
                style={{ width: `${otherPct}%` }}
                title={`System & Other: ${formatBytes(otherUsedBytes)}`}
              />
              {/* Free Space */}
              <div
                className="h-full bg-transparent transition-all duration-700 ease-out"
                style={{ width: `${freePct}%` }}
                title={`Free Space: ${formatBytes(freeBytes)}`}
              />
            </div>

            {/* Legend */}
            <div className="flex justify-between items-center text-[11px] font-medium text-muted-foreground px-1 whitespace-nowrap">
              <div className="flex gap-4">
                <span className="flex flex-col items-center gap-1 sm:flex-row">
                  <div className="flex items-center gap-1">
                    <Circle className="size-2 text-primary fill-primary" />
                    Recordings
                  </div>
                  ({formatBytes(recordingsSizeBytes)})
                </span>
                {disk && (
                  <span className="flex flex-col items-center gap-1 sm:flex-row">
                    <div className="flex items-center gap-1">
                      <Circle className="size-2 text-muted-foreground/40 fill-muted-foreground/40" />
                      Other
                    </div>
                    ({formatBytes(otherUsedBytes)})
                  </span>
                )}
              </div>
              <span>
                {disk ? `${formatBytes(freeBytes)} Free` : "Calculating..."}
              </span>
            </div>
          </div>
        </div>
      </div>

      <RecordingContextMenu baseUrl={baseUrl} />
      <RecordingModals baseUrl={baseUrl} />

      {snap.zipJobs && snap.zipJobs.length > 0 && (
        <div
          className="fixed bottom-0 right-6 flex flex-col z-50 w-80 bg-card/50 
                    backdrop-blur-sm rounded-t-md border-t border-x
                    animate-in slide-in-from-bottom-10 fade-in duration-300"
        >
          <div
            className="flex w-full justify-between items-center p-2 gap-2 border-b"
            onClick={() => recordingsActions.toggleZipDrawer()}
          >
            <Button variant="svg" className="p-2 h-auto">
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-300",
                  snap.isZipDrawerMinimized ? "rotate-180" : "",
                )}
              />
            </Button>
            <span className="text-sm font-semibold ml-1">
              {snap.zipJobs.length} Download{snap.zipJobs.length > 1 ? "s" : ""}
            </span>
            <Button
              variant="svg"
              className="p-2 h-auto"
              onClick={(e) => {
                e.stopPropagation();
                recordingsActions.openCancelAllModal();
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out",
              snap.isZipDrawerMinimized ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
            )}
          >
            <div className="overflow-hidden">
              <div className="flex flex-col max-h-[40vh] overflow-y-auto overflow-x-hidden p-2">
                {snap.zipJobs.map((job) => (
                  <div
                    key={job.id}
                    className=" p-4 flex flex-col gap-3 animate-in slide-in-from-right-10 fade-in duration-300"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col w-full gap-2">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <Spinner className="size-4" /> Zipping{" "}
                          {job.totalFiles} items...
                        </span>
                        <Progress
                          value={job.progress}
                          className="h-1.5 w-full"
                        />
                      </div>
                      <Button
                        variant="svg"
                        onClick={() =>
                          recordingsActions.cancelZip(baseUrl, job.id)
                        }
                        className="text-muted-foreground hover:text-foreground transition-colors py-0 pl-2 pr-0"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recordings;
