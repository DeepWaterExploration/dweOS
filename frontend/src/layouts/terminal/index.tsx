import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import React, { useContext, useEffect, useRef } from "react";
import { styles } from "../../style";
import { ClientOptions, Xterm } from "./xterm";
import WebsocketContext from "../../contexts/WebsocketContext";
import { TTYD_TOKEN_URL, TTYD_WS } from "../../utils/utils";
import CardContent from "@mui/material/CardContent";

const TerminalLayout = () => {
    const container = useRef<HTMLDivElement>();

    const { connected } = useContext(WebsocketContext);

    const xterm = useRef(
        new Xterm(
            {
                wsUrl: TTYD_WS(),
                tokenUrl: TTYD_TOKEN_URL(),
                flowControl: { limit: 100000, highWater: 10, lowWater: 4 },
                clientOptions: {
                    rendererType: "dom",
                    disableLeaveAlert: true,
                    disableResizeOverlay: false,
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
        if (connected) {
            container.current.innerHTML = "";
            xterm.current.connect();
            xterm.current.open(container.current);
        } else {
            xterm.current.dispose();
        }
    }, [connected]);

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
            <Paper
                sx={{
                    ...styles.card,
                    width: "90%",
                    height: "90%",
                    boxShadow: 20,
                    padding: 0,
                }}
            >
                <div
                    style={{
                        height: "100%",
                        backgroundColor: "#2b2b2b",
                        padding: 5,
                    }}
                >
                    <div
                        ref={container}
                        style={{
                            width: "100%",
                            height: "100%",
                            justifyContent: "center",
                            display: "flex",
                            alignItems: "center",
                        }}
                    ></div>
                </div>
            </Paper>
        </Grid>
    );
};

export default TerminalLayout;
