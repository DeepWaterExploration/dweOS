import { API_CLIENT } from "@/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { components } from "@/schemas/dwe_os_2";
import { useEffect, useState } from "react";
type RecordingInfo = components["schemas"]["RecordingInfo"];

const Recordings = () => {
    const hostAddress: string = window.location.hostname;
    const baseUrl = `http://${import.meta.env.DEV ? hostAddress + ":5000" : window.location.host}`;

    const [recordings, setRecordings] = useState<RecordingInfo[]>([]);
    const [selectedRecording, setSelectedRecording] = useState<RecordingInfo | null>(null);
    useEffect(() => {
        // Fetch recordings data from the backend
        API_CLIENT.GET("/recordings")
            .then(data => setRecordings(data.data!))
            .catch(error => console.error('Error fetching recordings:', error));
    }, []);
    return (
        <div className="flex">

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
                            <TableCell className="text-left">{recording.duration}</TableCell>
                            <TableCell className="text-left">{recording.size}</TableCell>
                        </TableRow>
                    ))}

                </TableBody>
            </Table>
            {selectedRecording && (
                <div className="mt-4 w-[50%] p-4 rounded h-full">
                    <h2 className="text-lg font-semibold">Selected Recording</h2>
                    <p><strong>Name:</strong> {selectedRecording.name}</p>
                    <p><strong>Format:</strong> {selectedRecording.format}</p>
                    <p><strong>Duration:</strong> {selectedRecording.duration}</p>
                    <p><strong>Size:</strong> {selectedRecording.size}</p>

                    <video
                        controls
                        className="w-full h-64 mt-4"
                        src={`${baseUrl}/recordings/${selectedRecording.name}`}
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
            )}
        </div>
    );
};

export default Recordings;
