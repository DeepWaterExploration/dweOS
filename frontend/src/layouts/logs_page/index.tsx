import { Box, Button, Typography } from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";

import React, { useEffect, useRef, useState } from "react";
import { websocket } from "../cameras";
import { deserializeMessage } from "../../utils/utils";
import { Log } from "../../types/types";
import { getLogs } from "../../utils/api";
import { useSnackbar } from "notistack";

const TerminalView = ({ logs }) => {
    const terminalRef = useRef(null);

    // Auto-scroll to the bottom of the terminal when new logs are added
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <Box
            ref={terminalRef}
            sx={{
                bgcolor: "black",
                color: "white",
                padding: 2,
                height: "calc(100vh - 250px)",
                overflowY: "scroll",
                borderRadius: 1,
                border: "1px solid #444",
            }}
        >
            {logs.map((log: Log, index) => (
                <Typography
                    key={index}
                    sx={{ fontFamily: "Fura Code, monospace", fontSize: 20 }}
                    variant='body2'
                >
                    <span style={{ color: "#FF5555" }}>{log.timestamp}</span>
                    {/* Red */}
                    <span> - </span>
                    <span style={{ color: "#50FA7B" }}>{log.level}</span>
                    {/* Green */}
                    <span> - </span>
                    <span style={{ color: "#FFB86C" }}>{log.name}</span>
                    {/* Orange */}
                    <span> - </span>
                    <span style={{ color: "#BD93F9" }}>
                        {log.filename}:{log.lineno}
                    </span>
                    {/* Purple */}
                    <span> - </span>
                    <span style={{ color: "#FF79C6" }}>{log.function}</span>
                    {/* Magenta */}
                    <span> - </span>
                    <span style={{ color: "#8BE9FD" }}>{log.message}</span>
                    {/* Cyan */}
                </Typography>
            ))}
        </Box>
    );
};

const formatLog = (log: Log): string => {
    return `${log.timestamp} - ${log.level} - ${log.name} - ${log.filename}:${log.lineno} - ${log.function} - ${log.message}`;
};

const createFilename = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `log_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.txt`;
};

const exportToFile = async () => {
    let logs = await getLogs();

    const blob = new Blob([logs.map(formatLog).join("\n")], {
        type: "text/plain",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = createFilename();
    document.body.appendChild(link);
    link.click();

    URL.revokeObjectURL(url);
    document.body.removeChild(link);
};

const copyToClipboard = async () => {
    let logs = await getLogs();
    navigator.clipboard.writeText(logs.map(formatLog).join("\n"));
};

const LogsPage = () => {
    const [logs, setLogs] = useState([] as Log[]);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        getLogs().then((log_values: Log[]) => {
            setLogs(log_values);

            websocket.addEventListener("message", (e) => {
                let message = deserializeMessage(e.data);
                let log = message.data as Log;
                switch (message.event_name) {
                    case "log":
                        setLogs((prevLogs) =>
                            [
                                ...prevLogs.filter(
                                    (l) => l.timestamp !== log.timestamp // check if it doesn't exist already: this is to prevent double sending the last message
                                ),
                                message.data as Log,
                            ].sort((a, b) => {
                                const dateA = new Date(
                                    a.timestamp.replace(",", ".")
                                );
                                const dateB = new Date(
                                    b.timestamp.replace(",", ".")
                                );
                                return dateA.getTime() - dateB.getTime();
                            })
                        );
                }
            });
        });
    }, []);
    return (
        <Grid2 sx={{ paddingX: 5 }}>
            <TerminalView logs={logs} />
            <Button
                onClick={() => {
                    exportToFile();
                }}
            >
                Export
            </Button>
            <Button
                onClick={() => {
                    copyToClipboard();
                    enqueueSnackbar("Copied to clipboard", { variant: "info" });
                }}
            >
                Copy Text
            </Button>
        </Grid2>
    );
};

export default LogsPage;
