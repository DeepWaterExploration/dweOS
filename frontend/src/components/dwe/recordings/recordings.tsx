import { API_CLIENT } from "@/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { components } from "@/schemas/dwe_os_2";
import { useEffect, useRef, useState } from "react";
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
    const baseUrl = `http://${import.meta.env.DEV ? hostAddress + ":5000" : window.location.host}`;

    const [recordings, setRecordings] = useState<RecordingInfo[]>([]);
    const [selectedRecording, setSelectedRecording] = useState<RecordingInfo | null>(null);

    const [loading, setLoading] = useState<boolean>(true);

    const [showMenu, setShowMenu] = useState(false);
    const [xPos, setXPos] = useState(0);
    const [yPos, setYPos] = useState(0);
    const [rightClickedRecording, setRightClickedRecording] = useState<RecordingInfo | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const handleContextMenu = (selected: RecordingInfo, event: React.MouseEvent<HTMLTableRowElement>) => {
        event.preventDefault();

        // Get the bounding rect of the container
        const container = event.currentTarget.closest('.relative') as HTMLElement;
        const containerRect = container?.getBoundingClientRect() || { left: 0, top: 0 };

        // Calculate position relative to the container
        const relativeX = event.clientX - containerRect.left;
        const relativeY = event.clientY - containerRect.top;

        // Set position with some offset to avoid covering the cursor
        setXPos(relativeX + 5);
        setYPos(relativeY + 5);
        setShowMenu(true);
        setRightClickedRecording(selected);
    };
    useEffect(() => {
        // Fetch recordings data from the backend
        API_CLIENT.GET("/recordings")
            .then(data => setRecordings(data.data!))
            .catch(error => console.error('Error fetching recordings:', error))
            .finally(() => setLoading(false));
    }, []);
    return (
        <div className="relative">

            <div className="flex pb-20">
                {loading ? <div className="flex items-center justify-center h-full w-full">Loading...</div> : (
                    <Table>
                        {showMenu && (

                            <div
                                style={{ left: xPos, top: yPos }}
                                className={`absolute bg-background border border-gray-300 p-2 rounded shadow-lg z-50`}
                                ref={menuRef}
                            >
                                <p className="px-4 pt-2 pb-4">{rightClickedRecording?.name}.{rightClickedRecording?.format}</p>

                                <div
                                    className="px-4 py-2 hover:bg-muted cursor-pointer rounded"
                                    onClick={() => {
                                        const newName = prompt(`Enter new name for "${rightClickedRecording?.name}":`, rightClickedRecording?.name);
                                        if (newName && newName.trim() && rightClickedRecording) {
                                            // @ts-ignore-next-line
                                            API_CLIENT.PATCH(`/recordings/${rightClickedRecording.name}.${rightClickedRecording.format}/${newName.trim()}.${rightClickedRecording.format}`, {})
                                                .then((newRecs) => {
                                                    setRecordings(newRecs.data! as RecordingInfo[]);
                                                    setShowMenu(false);
                                                })
                                                .catch(error => console.error('Error renaming recording:', error));
                                        } else {
                                            setShowMenu(false);
                                        }
                                    }}
                                >
                                    Rename
                                </div>
                                <div
                                    className="px-4 py-2 hover:bg-muted cursor-pointer text-red-500 rounded"
                                    onClick={() => {
                                        if (rightClickedRecording) {
                                            // @ts-ignore-next-line
                                            API_CLIENT.DELETE(`/recordings/${rightClickedRecording.name}.${rightClickedRecording.format}`, {})
                                                .then((newRecs) => {
                                                    setRecordings(newRecs.data! as RecordingInfo[]);
                                                    setShowMenu(false);
                                                })
                                                .catch(error => console.error('Error deleting recording:', error));
                                        }
                                    }}
                                >
                                    Delete
                                </div>
                            </div>
                        )}
                        <TableRow>
                            <TableCell className="text-left">Name</TableCell>
                            <TableCell className="text-left">Format</TableCell>
                            <TableCell className="text-left">Duration</TableCell>
                            <TableCell className="text-left">Size</TableCell>
                        </TableRow>
                        <TableBody>
                            {recordings.map((recording) => (
                                <TableRow key={recording.name} onClick={() => setSelectedRecording(recording)} onContextMenu={(e) => handleContextMenu(recording, e)}>
                                    <TableCell className="text-left">{recording.name}</TableCell>
                                    <TableCell className="text-left">{recording.format}</TableCell>
                                    <TableCell className="text-left">{recording.duration}</TableCell>
                                    <TableCell className="text-left">{formatFileSize(recording.size ? parseFloat(recording.size) : 0)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                {selectedRecording && (
                    <div className="mt-4 w-[50%] p-4 rounded h-full">
                        <h2 className="text-lg font-semibold">Selected Recording</h2>
                        <p><strong>Name:</strong> {selectedRecording.name}</p>
                        <p><strong>Format:</strong> {selectedRecording.format}</p>
                        <p><strong>Duration:</strong> {selectedRecording.duration}</p>
                        <p><strong>Size:</strong> {formatFileSize(selectedRecording.size ? parseFloat(selectedRecording.size) : 0)}</p>

                        {selectedRecording.format === "mp4" ?
                            <video
                                key={`${selectedRecording.name}.${selectedRecording.format}`}
                                controls
                                className="w-full h-64 mt-4"
                            >
                                <source src={`${baseUrl}/recordings/${selectedRecording.name}.${selectedRecording.format}`} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video> : <div className="w-full h-64 mt-4 bg-gray color-red-900 flex items-center justify-center flex-col flex-wrap">
                                <p className="color-red-900">.{selectedRecording.format} is not supported in the browser video player.<br />Use the download button to download the file and play it in a compatible player like VLC.</p>
                            </div>
                        }
                        <Button
                            variant="outline"
                            className="mt-4"
                            asChild
                        >
                            <a href={`${baseUrl}/recordings/${selectedRecording.name}.${selectedRecording.format}?download=true`} download>
                                Download
                            </a>
                        </Button>
                        <Button
                            variant="outline"
                            className="mt-4 ml-2 text-red-500 border-red-500"
                            onClick={async () => {
                                // @ts-ignore-next-line
                                const new_recordings = (await API_CLIENT.DELETE(`/recordings/${selectedRecording.name}.${selectedRecording.format}`, {})).data! as RecordingInfo[];
                                setRecordings(new_recordings);
                                setSelectedRecording(null);
                            }}
                        >
                            Delete
                        </Button>
                    </div>
                )}
            </div>

            {/* Sticky footer at bottom of viewport */}
            <div className="fixed bottom-0 left-0 right-0 border-t bg-black border-gray-200 p-4 shadow-lg z-10">
                <div className="flex justify-between items-center max-w-full">
                    <Button
                        variant="outline"
                        asChild
                    >
                        <a href={`${baseUrl}/recording/zip`} download>
                            Download All as ZIP
                        </a>
                    </Button>
                    <div className="flex gap-6">
                        <span>Total Recordings: {recordings.length}</span>
                        <span>Total Size: {formatFileSize(recordings.reduce((acc, rec) => acc + (rec.size ? parseFloat(rec.size) : 0), 0))}</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Recordings;
