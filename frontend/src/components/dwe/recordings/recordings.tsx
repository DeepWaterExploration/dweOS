import { RecordingContextMenu } from "@/components/dwe/recordings/components/recording-context-menu";
import RecordingModals from "@/components/dwe/recordings/components/recording-modals";
import { RecordingTable } from "@/components/dwe/recordings/components/recording-table";
import {
  recordingsActions,
  recordingsState,
} from "@/components/dwe/recordings/store/recording-store";
import {
  DEMO_RECORDING,
  formatFileSize,
} from "@/components/dwe/recordings/utils/recording-utils";
import { useTour } from "@/components/tour/tour";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";
import { components } from "@/schemas/dwe_os_2";
import { Download, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSnapshot } from "valtio";

type RecordingInfo = components["schemas"]["RecordingInfo"];

const Recordings = () => {
  const hostAddress: string = window.location.hostname;
  const baseUrl = `http://${
    import.meta.env.DEV ? hostAddress + ":5000" : window.location.host
  }`;
  const snap = useSnapshot(recordingsState);
  const { isActive } = useTour();

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

  const handleSort = (column: keyof RecordingInfo) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const displayRecordings = useMemo(() => {
    let data = isActive ? [DEMO_RECORDING] : snap.recordings;

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
  }, [snap.recordings, sortColumn, sortDirection, isActive, searchQuery]);

  return (
    <div
      className="flex flex-col h-[calc(100vh-5.5rem)] gap-2"
      id={TOUR_STEP_IDS.REC_PAGE}
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
        <div className="flex-1 min-w-0 overflow-x-auto border rounded-xl">
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
        id={TOUR_STEP_IDS.RECORDING_FOOTER}
      >
        <div className="flex justify-between items-center max-w-full gap-2">
          {snap.selectedNames.length > 0 ? (
            <ButtonGroup>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => recordingsActions.downloadZip(baseUrl)}
                disabled={snap.zipDownloading || snap.recordings.length === 0}
              >
                {snap.zipDownloading ? (
                  <div className="flex items-center gap-2">
                    Zipping <Spinner className="size-4" />
                  </div>
                ) : (
                  <Download className="size-4" />
                )}
              </Button>
              <Button
                variant="outline"
                className="cursor-pointer hover:bg-destructive"
                disabled={snap.deleteSubmitting || snap.recordings.length === 0}
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
          <div className="select-none flex flex-col gap-2 text-sm text-muted-foreground">
            <span>
              Total Recordings:{" "}
              <span className="text-foreground font-medium">
                {snap.recordings.length}
              </span>
            </span>
            <span>
              Total Size:{" "}
              <span className="text-foreground font-medium">
                {formatFileSize(
                  snap.recordings.reduce(
                    (acc, rec) => acc + (rec.size ? parseFloat(rec.size) : 0),
                    0,
                  ),
                )}
              </span>
            </span>
          </div>
        </div>
      </div>
      <RecordingContextMenu baseUrl={baseUrl} />
      <RecordingModals baseUrl={baseUrl} />
    </div>
  );
};

export default Recordings;
