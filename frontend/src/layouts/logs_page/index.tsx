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
            {logs.map((log, index) => (
                <Typography
                    key={index}
                    sx={{ fontFamily: "Fura Code, monospace", fontSize: 20 }}
                    variant='body2'
                >
                    {log}
                </Typography>
            ))}
        </Box>
    );
};

const exportToFile = async () => {
    let logs = await getLogs();

    const blob = new Blob([logs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "logs.txt";
    document.body.appendChild(link);
    link.click();

    URL.revokeObjectURL(url);
    document.body.removeChild(link);
};

const copyToClipboard = async () => {
    let logs = await getLogs();
    navigator.clipboard.writeText(logs.join("\n"));
};

const LogsPage = () => {
    const [logs, setLogs] = useState([]);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        getLogs().then((log_values) => {
            setLogs(log_values);

            websocket.addEventListener("message", (e) => {
                let message = deserializeMessage(e.data);
                switch (message.event_name) {
                    case "log":
                        setLogs((prevLogs) => [
                            ...prevLogs,
                            (message.data as Log).log,
                        ]);
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
