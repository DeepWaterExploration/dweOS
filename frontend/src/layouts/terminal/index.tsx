import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import React, { useEffect, useRef } from "react";
import { styles } from "../../style";
import { ClientOptions, Xterm } from "./xterm";

const TerminalLayout = () => {
    const container = useRef<HTMLDivElement>();

    const xterm = useRef(
        new Xterm(
            {
                wsUrl: `ws://${window.location.hostname}:7681/ws`,
                tokenUrl: `http://${window.location.hostname}:7681/token`,
                flowControl: { limit: 100000, highWater: 10, lowWater: 4 },
                clientOptions: {
                    rendererType: "webgl",
                    disableLeaveAlert: false,
                    disableResizeOverlay: false,
                    enableZmodem: false,
                    enableTrzsz: false,
                    enableSixel: false,
                    isWindows: false,
                    unicodeVersion: "11",
                    trzszDragInitTimeout: 0,
                } as ClientOptions,
                termOptions: {
                    fontSize: 20,
                    fontFamily:
                        "Consolas,Liberation Mono,Menlo,Courier,monospace",
                    theme: {
                        foreground: "#d2d2d2",
                        background: "#2b2b2b",
                        cursor: "#adadad",
                        black: "#000000",
                        red: "#d81e00",
                        green: "#5ea702",
                        yellow: "#cfae00",
                        blue: "#427ab3",
                        magenta: "#89658e",
                        cyan: "#00a7aa",
                        white: "#dbded8",
                        brightBlack: "#686a66",
                        brightRed: "#f54235",
                        brightGreen: "#99e343",
                        brightYellow: "#fdeb61",
                        brightBlue: "#84b0d8",
                        brightMagenta: "#bc94b7",
                        brightCyan: "#37e6e8",
                        brightWhite: "#f1f1f0",
                    },
                    allowProposedApi: true,
                },
            },
            () => {}
        )
    );

    useEffect(() => {
        xterm.current.connect();

        xterm.current.open(container.current);
    }, []);

    return (
        <Grid
            container
            spacing={4}
            alignItems='baseline'
            flexWrap='wrap'
            style={{
                justifyContent: "space-evenly",
                height: "100%",
            }}
        >
            <Card
                sx={{
                    ...styles.card,
                    height: "90%",
                    width: "90%",
                    boxShadow: 20,
                }}
            >
                <div
                    ref={container}
                    style={{ width: "100%", height: "100%", padding: 0 }}
                ></div>
            </Card>
        </Grid>
    );
};

export default TerminalLayout;
