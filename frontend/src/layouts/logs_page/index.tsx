import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";

import React, { useContext, useEffect, useState } from "react";
import { deserializeMessage } from "../../utils/utils";
import { getLogs } from "./api";
import { useSnackbar } from "notistack";
import { Log } from "./types";
import TerminalViewLayout from "./components/TerminalView";
import WebsocketContext from "../../contexts/WebsocketContext";

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

    const { websocket, connected } = useContext(WebsocketContext) as {
        websocket: WebSocket;
        connected: boolean;
    };

    const socketCallback = (e: WebSocketEventMap["message"]) => {
        let message = deserializeMessage(e.data);
        let log = message.data as Log;
        switch (message.event_name) {
            case "log":
                setLogs((prevLogs) =>
                    [...prevLogs, message.data as Log].sort((a, b) => {
                        const dateA = new Date(a.timestamp.replace(",", "."));
                        const dateB = new Date(b.timestamp.replace(",", "."));
                        return dateA.getTime() - dateB.getTime();
                    })
                );
        }
    };

    const getInitialLogs = () => {
        getLogs().then((log_values: Log[]) => {
            setLogs(log_values);

            websocket.addEventListener("message", socketCallback);
        });
    };

    useEffect(() => {
        if (connected) {
            getInitialLogs();
        }

        return () => {
            if (websocket)
                websocket.removeEventListener("message", socketCallback);
        };
    }, [connected]);
    return (
        <Grid sx={{ paddingX: 5 }}>
            <TerminalViewLayout logs={logs} />
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
        </Grid>
    );
};

export default LogsPage;
