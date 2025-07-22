import { useContext, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/components/themes/theme-provider";
import { Xterm, ClientOptions } from "./xterm";
import { ITerminalOptions } from "@xterm/xterm";
import WebsocketContext from "@/contexts/WebsocketContext";
import { TTYD_TOKEN_URL, TTYD_WS } from "@/api";

const darkTermColors = {
  foreground: "#d2d2d2",
  background: "#1f2937",
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
};

const lightTermColors = {
  foreground: "#333333",
  background: "#ffffff",
  cursor: "#333333",
  black: "#000000",
  red: "#c92a2a",
  green: "#2f9e44",
  yellow: "#f08c00",
  blue: "#1864ab",
  magenta: "#5f3dc4",
  cyan: "#1098ad",
  white: "#f8f9fa",
  brightBlack: "#868e96",
  brightRed: "#fa5252",
  brightGreen: "#40c057",
  brightYellow: "#fcc419",
  brightBlue: "#228be6",
  brightMagenta: "#845ef7",
  brightCyan: "#15aabf",
  brightWhite: "#ffffff",
};

export const Terminal = () => {
  const container = useRef<HTMLDivElement>(null);
  const originalTitle = useRef(document.title);
  const { connected } = useContext(WebsocketContext)!;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

  const { theme } = useTheme();
  const themeColor = theme === "system" ? systemTheme : theme;

  const xterm = useRef(
    new Xterm(
      {
        wsUrl: TTYD_WS,
        tokenUrl: TTYD_TOKEN_URL,
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
          fontFamily: "Consolas, Liberation Mono, Menlo, Courier, monospace",
          theme: themeColor === "dark" ? darkTermColors : lightTermColors,
          allowProposedApi: true,
        } as ITerminalOptions,
      },
      () => { }
    )
  );

  // Reconnect / dispose when websocket connection toggles
  useEffect(() => {
    if (connected && container.current) {
      container.current.innerHTML = "";
      xterm.current.connect();
      xterm.current.open(container.current);
    } else {
      xterm.current.dispose();
    }
  }, [connected]);

  // Update Xterm.js theme when ShadCN theme changes
  useEffect(() => {
    const colors = themeColor === "dark" ? darkTermColors : lightTermColors;
    xterm.current.setTheme(colors);
  }, [themeColor]);

  // Restore document title on unmount
  useEffect(() => {
    return () => {
      document.title = originalTitle.current;
    };
  }, []);

  return (
    <div className="h-full pl-2 pr-2 pb-4">
      <Card className="h-full rounded-2xl shadow-xl overflow-hidden bg-white dark:bg-gray-800">
        <CardContent className="h-full p-0">
          <div className="h-full p-2">
            <div ref={container} className="w-full h-full box-border" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Terminal;
