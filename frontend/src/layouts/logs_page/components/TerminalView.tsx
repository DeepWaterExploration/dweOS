import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import React, { useEffect, useRef } from "react";
import { Log } from "../types";

const TerminalViewLayout = ({ logs }) => {
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

export default TerminalViewLayout;
