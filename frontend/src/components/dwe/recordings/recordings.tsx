import { API_CLIENT } from "@/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableRow } from "@/components/ui/table"
import { components } from "@/schemas/dwe_os_2";
import { useEffect, useState } from "react";
type RecordingInfo = components["schemas"]["RecordingInfo"];

const Recordings = () => {
    const hostAddress: string = window.location.hostname;
    const baseUrl = `http://${import.meta.env.DEV ? hostAddress + ":5000" : window.location.host}`;

    const [recordings, setRecordings] = useState<RecordingInfo[]>([]);
    const [selectedRecording, setSelectedRecording] = useState<RecordingInfo | null>(null);

    const [isFirefox, setIsFirefox] = useState<boolean>(navigator.userAgent.toLowerCase().includes('firefox'));

    const [loading, setLoading] = useState<boolean>(true);
    useEffect(() => {
        // Fetch recordings data from the backend
        API_CLIENT.GET("/recordings")
            .then(data => setRecordings(data.data!))
            .catch(error => console.error('Error fetching recordings:', error))
            .finally(() => setLoading(false));
    }, []);
    return (
        <div className="flex">
            {loading ? <div className="flex items-center justify-center h-full w-full">Loading...</div> : (
                <Table>
                    <TableRow>
                        <TableCell className="text-left">Name</TableCell>
                        <TableCell className="text-left">Format</TableCell>
                        <TableCell className="text-left">Duration</TableCell>
                        <TableCell className="text-left">Size</TableCell>
                    </TableRow>
                    <TableBody>
                        {recordings.map((recording) => (
                            <TableRow key={recording.name} onClick={() => setSelectedRecording(recording)}>
                                <TableCell className="text-left">{recording.name}</TableCell>
                                <TableCell className="text-left">{recording.format}</TableCell>
                                <TableCell className="text-left">~{recording.duration}</TableCell>
                                <TableCell className="text-left">{recording.size}</TableCell>
                            </TableRow>
                        ))}

                    </TableBody>
                    {recordings.length !== 0 && (
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">
                                    Video durations are an estimate and may not be accurate.
                                </TableCell>
                            </TableRow>

                        </TableFooter>
                    )}
                </Table>
            )}
            {selectedRecording && (
                <div className="mt-4 w-[50%] p-4 rounded h-full">
                    <h2 className="text-lg font-semibold">Selected Recording</h2>
                    <p><strong>Name:</strong> {selectedRecording.name}</p>
                    <p><strong>Format:</strong> {selectedRecording.format}</p>
                    <p><strong>Duration:</strong> {selectedRecording.duration}</p>
                    <p><strong>Size:</strong> {selectedRecording.size}</p>

                    <video
                        key={`${selectedRecording.name}.${selectedRecording.format}`}
                        controls
                        className="w-full h-64 mt-4"
                    >
                        <source src={`${baseUrl}/recordings/${selectedRecording.name}.${selectedRecording.format}`} type={`video/${selectedRecording.format}`} />
                        {isFirefox && (<p>Firefox does not support this MP4 format, download the recording instead.</p>)}
                        Your browser does not support the video tag.
                    </video>
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

            )
            }
        </div >
    );
};

export default Recordings;
