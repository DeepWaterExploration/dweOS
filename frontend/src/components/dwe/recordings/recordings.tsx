import { API_CLIENT } from "@/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { components } from "@/schemas/dwe_os_2";
import { Separator } from "@radix-ui/react-separator";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Download, Trash } from "lucide-react";
type RecordingInfo = components["schemas"]["RecordingInfo"];

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
  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)]">
      <div className="flex min-h-0">
        {/* handles right click on recordings */}
        {showMenu && (
          <div
            style={{ left: xPos, top: yPos }}
            className={`fixed w-128 bg-muted border rounded-xl shadow-lg z-50 text-sm`}
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
              className="mx-2 my-1 px-2 py-1 hover:bg-accent hover:text-foreground cursor-pointer text-red-500 rounded-md"
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
        {loading ? (
          <div className="flex items-center justify-center h-full w-full">
            Loading...
          </div>
        ) : (
          <Table>
            <TableRow>
              <TableCell
                className="text-left cursor-pointer hover:bg-accent rounded-t-xl"
                onClick={() => handleSort("name")}
              >
                Name&nbsp;&nbsp;
                {sortColumn === "name" && (sortDirection === "asc" ? "▲" : "▼")}
              </TableCell>
              <TableCell
                className="text-left w-40 cursor-pointer hover:bg-accent rounded-t-xl"
                onClick={() => handleSort("created")}
              >
                Created&nbsp;&nbsp;
                {sortColumn === "created" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </TableCell>
              <TableCell
                className="text-left w-24 cursor-pointer hover:bg-accent rounded-t-xl"
                onClick={() => handleSort("duration")}
              >
                Duration&nbsp;&nbsp;
                {sortColumn === "duration" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </TableCell>
              <TableCell
                className="text-left w-24 cursor-pointer hover:bg-accent rounded-t-xl"
                onClick={() => handleSort("size")}
              >
                Size&nbsp;&nbsp;
                {sortColumn === "size" && (sortDirection === "asc" ? "▲" : "▼")}
              </TableCell>
            </TableRow>
            <TableBody>
              {recordings.map((recording) => (
                <TableRow
                  key={recording.name}
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
                      ? "bg-muted cursor-pointer"
                      : "cursor-pointer bg-background hover:bg-accent rounded-xl"
                  }
                >
                  <TableCell className="text-left">
                    {recording.name}.{recording.format}
                  </TableCell>
                  <TableCell className="text-left w-40">
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
        {/* handles recording detailed view */}
        <div
          className={`transition-[width] ease-in-out duration-500 rounded-xl overflow-y-auto ml-1 -mr-8 my-2 bg-sidebar overflow-x-hidden
          ${selectedRecording ? "w-[70%] p-4 pr-8" : "w-[0]"}`}
        >
          <p>
            <strong className="text-muted-foreground">Name</strong>
            <br />
            <h1 className="text-2xl font-bold">
              {selectedRecording?.name}.{selectedRecording?.format}
            </h1>
          </p>
          {selectedRecording?.format === "mp4" ? (
            <video
              key={`${selectedRecording.name}.${selectedRecording.format}`}
              controls
              className="w-fit h-fit my-2 border rounded-xl"
            >
              <source
                src={`${baseUrl}/recordings/${selectedRecording.name}.${selectedRecording.format}`}
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="h-fit my-4 text-center border py-4 rounded-lg bg-background">
              <p className="text-muted-foreground italic p-4 text-sm">
                .{selectedRecording?.format} is not supported in the browser
                video player.
                <br />
                Use the download button to download the file and play it in a
                compatible player like VLC.
              </p>
            </div>
          )}
          <div className="flex justify-between p-4 border rounded-lg bg-background text-sm">
            <div className="flex-col">
              <p>
                <strong className="text-muted-foreground">Format:</strong>{" "}
                {selectedRecording?.format
                  .toLocaleUpperCase()
                  .replace("MP4", "MPEG-4")}
              </p>
              <p>
                <strong className="text-muted-foreground">Created:</strong>{" "}
                {selectedRecording?.created}
              </p>
            </div>
            <div className="flex-col place-items-end">
              <p>
                <strong className="text-muted-foreground">Duration:</strong>{" "}
                {selectedRecording?.duration}
              </p>
              <p>
                <strong className="text-muted-foreground">Size:</strong>{" "}
                {formatFileSize(
                  selectedRecording?.size
                    ? parseFloat(selectedRecording.size)
                    : 0
                )}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="mt-4 bg-accent text-background"
              asChild
            >
              <a
                href={`${baseUrl}/recordings/${selectedRecording?.name}.${selectedRecording?.format}?download=true`}
                download
              >
                <Download />
              </a>
            </Button>
            <Button
              variant="outline"
              className="mt-4 ml-2 text-background bg-red-500 hover:text-foreground hover:bg-red-500"
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
              <Trash />
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky footer at bottom of viewport */}
      <div className="border-t border-muted bg-background p-4 shadow-lg z-10">
        <div className="flex justify-between items-center max-w-full">
          <Button variant="outline" asChild>
            <a href={`${baseUrl}/recording/zip`} download>
              Download All as ZIP
            </a>
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
