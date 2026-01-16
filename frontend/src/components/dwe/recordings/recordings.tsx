import { API_CLIENT } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { components } from "@/schemas/dwe_os_2";
import { Separator } from "@/components/ui/separator";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  FolderArchive,
  Trash,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { useTour } from "@/components/tour/tour";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TruncatedTooltip,
} from "@/components/ui/tooltip";

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

const Recordings = () => {
  const hostAddress: string = window.location.hostname;
  const baseUrl = `http://${
    import.meta.env.DEV ? hostAddress + ":5000" : window.location.host
  }`;

  const [recordings, setRecordings] = useState<RecordingInfo[]>([]);
  const [selectedRecording, setSelectedRecording] =
    useState<RecordingInfo | null>(null);

  const [sortColumn, setSortColumn] = useState<keyof RecordingInfo | null>(
    null
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null
  );

  const { isActive } = useTour();

  const sortRecordings = () => {
    var modifier = (x: any) => x;
    if (sortColumn === "size") {
      modifier = (x: string) => parseFloat(x);
    }
    if (sortColumn) {
      const sorted = [...recordings].sort((a, b) => {
        if (sortDirection === "asc") {
          return modifier(a[sortColumn]) > modifier(b[sortColumn]) ? 1 : -1;
        } else {
          return modifier(a[sortColumn]) < modifier(b[sortColumn]) ? 1 : -1;
        }
      });
      setRecordings(sorted);
    }
  };

  useEffect(() => {
    sortRecordings();
  }, [sortColumn, sortDirection]);

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

  useEffect(() => {
    const handleInterrupt = (event: Event) => {
      if (event.type == "wheel") {
        setShowMenu(false);
        setRightClickedRecording(null);
      }

      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setRightClickedRecording(null);
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

      // Check right boundary if exceeding flip to left of cursor
      if (xPos + menuWidth > viewportWidth) {
        newX = xPos - menuWidth;
      }

      // Check bottom boundary, if exceeding flip to top odf cursor
      if (yPos + menuHeight > viewportHeight) {
        newY = yPos - menuHeight;
      }

      // Update state if x/y were changed
      if (newX !== xPos || newY !== yPos) {
        setXPos(newX);
        setYPos(newY);
      }
    }
  }, [showMenu, xPos, yPos]);

  const handleContextMenu = (
    selected: RecordingInfo,
    event: React.MouseEvent<HTMLTableRowElement>
  ) => {
    event.preventDefault();

    // Set position
    setXPos(event.clientX);
    setYPos(event.clientY);
    setShowMenu(true);
    setRightClickedRecording(selected);
  };

  useEffect(() => {
    // Fetch recordings data from the backend
    API_CLIENT.GET("/recordings")
      .then((data) => setRecordings(data.data!))
      .then(() => {
        sortRecordings();
      })
      .catch((error) => console.error("Error fetching recordings:", error))
      .finally(() => setLoading(false));
  }, []);

  const displayRecordings = useMemo(() => {
    let data = isActive ? [DEMO_RECORDING] : recordings;
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      let valA: any = a[sortColumn];
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

  return (
    <div
      className="flex flex-col h-[calc(100vh-5.5rem)]"
      id={TOUR_STEP_IDS.REC_PAGE}
    >
      <div className="flex min-h-0">
        {/* handles right click on recordings */}
        {showMenu && (
          <div
            style={{ left: xPos, top: yPos }}
            className={`fixed w-128 bg-muted/50 backdrop-blur border rounded-xl shadow-lg z-50 text-sm pb-1`}
            ref={menuRef}
          >
            <p className="p-4 pb-2 truncate">
              {rightClickedRecording?.name}.{rightClickedRecording?.format}
            </p>
            <Separator className="bg-border h-[1px] mx-2" />
            <div
              className="mx-2 my-1 px-2 py-1 hover:bg-accent cursor-pointer rounded-md"
              onClick={() => {
                const newName = prompt(
                  `Enter new name for "${rightClickedRecording?.name}":`,
                  rightClickedRecording?.name
                );
                if (newName && newName.trim() && rightClickedRecording) {
                  // @ts-ignore-next-line
                  API_CLIENT.PATCH(
                    // @ts-ignore-next-line
                    `/recordings/${rightClickedRecording.name}.${
                      rightClickedRecording.format
                    }/${newName.trim()}.${rightClickedRecording.format}`,
                    {}
                  )
                    .then((newRecs) => {
                      setRecordings(newRecs.data! as RecordingInfo[]);
                      setShowMenu(false);
                    })
                    .catch((error) =>
                      console.error("Error renaming recording:", error)
                    );
                } else {
                  setShowMenu(false);
                }
              }}
            >
              Rename
            </div>

            <div
              className="mx-2 my-1 px-2 py-1 hover:bg-red-500 hover:text-foreground cursor-pointer text-red-500 rounded-md"
              onClick={() => {
                if (rightClickedRecording) {
                  // @ts-ignore-next-line
                  API_CLIENT.DELETE(
                    // @ts-ignore-next-line
                    `/recordings/${rightClickedRecording.name}.${rightClickedRecording.format}`,
                    {}
                  )
                    .then((newRecs) => {
                      setRecordings(newRecs.data! as RecordingInfo[]);
                      setShowMenu(false);
                    })
                    .catch((error) =>
                      console.error("Error deleting recording:", error)
                    );
                }
              }}
            >
              Delete
            </div>
          </div>
        )}
        {/* handles recording display */}
        <div className="flex-1 overflow-x-auto transition-all duration-500 border rounded-xl">
          {" "}
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
                    className="cursor-pointer hover:bg-muted w-44"
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
                    onClick={() => {
                      if (selectedRecording === recording) {
                        setSelectedRecording(null);
                      } else {
                        setSelectedRecording(recording);
                      }
                    }}
                    onContextMenu={(e) => handleContextMenu(recording, e)}
                    className={
                      selectedRecording === recording
                        ? "bg-accent cursor-pointer"
                        : "cursor-pointer bg-background hover:bg-muted rounded-xl"
                    }
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
                    <TableCell className="text-left w-40 font-mono text-xs">
                      {recording.created}
                    </TableCell>
                    <TableCell className="text-left w-24">
                      {recording.duration}
                    </TableCell>
                    <TableCell className="text-left w-24">
                      {formatFileSize(
                        recording.size ? parseFloat(recording.size) : 0
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        {/* handles recording detailed view */}
        <div
          className={`transition-all flex absolute right-0 bottom-4 ease-in-out duration-500 rounded-l-xl bg-transparent overflow-hidden shrink-0
          ${
            selectedRecording
              ? "w-full md:w-[50%] md:min-w-[450px]"
              : "w-[0] min-w-0"
          }`}
        >
          <div
            onClick={() => setSelectedRecording(null)}
            className="flex flex-col justify-center my-8 h-auto cursor-pointer group hover:bg-accent bg-sidebar/50 backdrop-blur border border-r-0 rounded-l-2xl"
          >
            <X className="h-10 w-10 text-muted-foreground group-hover:text-foreground p-2" />
          </div>
          <div className="flex-col space-y-2 w-full h-full min-w-[400px] p-4 bg-sidebar/50 backdrop-blur border rounded-l-2xl">
            {selectedRecording?.format === "mp4" ? (
              <video
                key={`${selectedRecording.name}.${selectedRecording.format}`}
                controls
                className="w-fit h-fit border rounded-xl"
              >
                <source
                  src={`${baseUrl}/recordings/${selectedRecording.name}.${selectedRecording.format}`}
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="h-fit text-center border py-4 rounded-lg bg-background">
                <p className="text-muted-foreground italic p-4 text-sm">
                  .{selectedRecording?.format} is not supported in the browser
                  video player.
                  <br />
                  Use the download button to download the file and play it in a
                  compatible player like VLC.
                </p>
              </div>
            )}
            <div className="p-2">
              <h1 className="text-2xl font-mono font-bold">
                {selectedRecording?.name}.{selectedRecording?.format}
              </h1>
            </div>
            <div className="flex gap-2 p-2 text-sm border rounded-lg bg-background">
              <Separator orientation="vertical" className="w-[2px]" />
              <div className="flex-col">
                <p>
                  <strong className="text-muted-foreground font-mono">
                    Format:
                  </strong>{" "}
                  {selectedRecording?.format
                    .toLocaleUpperCase()
                    .replace("MP4", "MPEG-4")}
                </p>
                <p>
                  <strong className="text-muted-foreground font-mono">
                    Created:
                  </strong>{" "}
                  {selectedRecording?.created}
                </p>
                <p>
                  <strong className="text-muted-foreground font-mono">
                    Duration:
                  </strong>{" "}
                  {selectedRecording?.duration}
                </p>
                <p>
                  <strong className="text-muted-foreground font-mono">
                    Size:
                  </strong>{" "}
                  {formatFileSize(
                    selectedRecording?.size
                      ? parseFloat(selectedRecording.size)
                      : 0
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant="outline"
                className="bg-accent flex-1 min-w-[140px] h-12 text-background"
                asChild
              >
                <a
                  href={`${baseUrl}/recordings/${selectedRecording?.name}.${selectedRecording?.format}?download=true`}
                  download
                >
                  <Download /> Download
                </a>
              </Button>
              <Button
                variant="outline"
                className="flex-1 min-w-[140px] h-12 text-background bg-destructive hover:text-foreground hover:bg-red-500"
                onClick={async () => {
                  // @ts-ignore-next-line
                  const new_recordings = (
                    await API_CLIENT.DELETE(
                      // @ts-ignore-next-line
                      `/recordings/${selectedRecording.name}.${selectedRecording.format}`,
                      {}
                    )
                  ).data! as RecordingInfo[];
                  setRecordings(new_recordings);
                  setSelectedRecording(null);
                }}
              >
                <Trash /> Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* footer at bottom of viewport */}
      <div
        className="bg-background p-4 mt-auto"
        id={TOUR_STEP_IDS.RECORDING_FOOTER}
      >
        <div className="flex justify-between items-center max-w-full">
          <Button variant="outline" asChild className="cursor-pointer">
            <div>
              <FolderArchive />
              <a href={`${baseUrl}/recording/zip`} download>
                Download All
              </a>
            </div>
          </Button>
          <div className="flex gap-6">
            <span>Total Recordings: {recordings.length}</span>
            <span>
              Total Size:{" "}
              {formatFileSize(
                recordings.reduce(
                  (acc, rec) => acc + (rec.size ? parseFloat(rec.size) : 0),
                  0
                )
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recordings;
