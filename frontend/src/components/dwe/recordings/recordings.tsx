import { API_CLIENT } from "@/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { components } from "@/schemas/dwe_os_2";
import { useEffect, useState } from "react";
type RecordingInfo = components["schemas"]["RecordingInfo"];

const Recordings = () => {

    const [recordings, setRecordings] = useState<RecordingInfo[]>([]);
    useEffect(() => {
        // Fetch recordings data from the backend
        API_CLIENT.GET("/recordings")
            .then(data => setRecordings(data.data!))
            .catch(error => console.error('Error fetching recordings:', error));
    }, []);
    return (
        <Table>
            <TableRow>
                <TableCell className="text-left">Name</TableCell>
                <TableCell className="text-left">Format</TableCell>
                <TableCell className="text-left">Duration</TableCell>
                <TableCell className="text-left">Size</TableCell>
            </TableRow>
            <TableBody>
                {recordings.map((recording) => (
                    <TableRow key={recording.name}>
                        <TableCell className="text-left">{recording.name}</TableCell>
                        <TableCell className="text-left">{recording.format}</TableCell>
                        <TableCell className="text-left">{recording.duration}</TableCell>
                        <TableCell className="text-left">{recording.size}</TableCell>
                    </TableRow>
                ))}

            </TableBody>
        </Table>
    );
};

export default Recordings;
