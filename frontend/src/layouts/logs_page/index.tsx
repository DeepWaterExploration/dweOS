import { Box, Typography } from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";

import React, { useEffect, useRef, useState } from "react";
import { websocket } from "../cameras";
import { deserializeMessage } from "../../utils/utils";
import { Log } from "../../types/types";

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
                height: "400px",
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

const LogsPage = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
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
    }, []);
    return (
        <Grid2 sx={{ paddingX: 5 }}>
            <TerminalView logs={logs} />
        </Grid2>
    );
};

export default LogsPage;
