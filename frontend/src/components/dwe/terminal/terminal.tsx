import { TTYD_TOKEN_URL, TTYD_WS } from "@/api";
import { useTheme } from "@/components/themes/theme-provider";
import { TOUR_STEP_IDS } from "@/components/tour/tour-lib/tour-constants";
import { Card, CardContent } from "@/components/ui/card";
import FeaturesContext from "@/contexts/FeaturesContext";
import WebsocketContext from "@/contexts/WebsocketContext";
import { ITerminalOptions } from "@xterm/xterm";
import { useContext, useEffect, useRef } from "react";
import FeatureNotSupported from "../app/not-supported";
import { Markdown } from "../markdown";
import { ClientOptions, Xterm } from "./xterm";

const darkTermColors = {
  background: "#1d1e23",
  foreground: "#d8d9df",
  cursor: "#a0a1ad",
  black: "#33333b",
  red: "#9d516a",
  green: "#677440",
  yellow: "#8e623d",
  blue: "#417395",
  magenta: "#775ca4",
  cyan: "#40796e",
  white: "#a0a1ad",
  brightBlack: "#585964",
  brightRed: "#b96681",
  brightGreen: "#7d8b50",
  brightYellow: "#aa774e",
  brightBlue: "#538bb1",
  brightMagenta: "#8e73bd",
  brightCyan: "#509285",
  brightWhite: "#cccdd5",
};

const lightTermColors = {
  background: "#ffffff",
  foreground: "#141522",
  cursor: "#525476",
  black: "#d2d3e6",
  red: "#9d516a",
  green: "#677440",
  yellow: "#8e623d",
  blue: "#417395",
  magenta: "#775ca4",
  cyan: "#40796e",
  white: "#525476",
  brightBlack: "#a0a2c5",
  brightRed: "#b96681",
  brightGreen: "#7d8b50",
  brightYellow: "#aa774e",
  brightBlue: "#538bb1",
  brightMagenta: "#8e73bd",
  brightCyan: "#509285",
  brightWhite: "#2b2b41",
};

const TTYD_NOT_SUPPORTED_MSG = `
TTYD is not currently enabled in the backend.

- If you installed dweOS yourself, please enable the ttyd option by removing \`--no-ttyd\`.
- If you have installed dweOS as an extension on BlueOS, please use the builtin terminal in BlueOS
`.trim();

export const Terminal = () => {
  const container = useRef<HTMLDivElement>(null);
  const originalTitle = useRef(document.title);
  const { connected } = useContext(WebsocketContext)!;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

  const features = useContext(FeaturesContext);

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
      () => {},
    ),
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

  // Update terminal size
  useEffect(() => {
    if (!container.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (xterm.current) {
        requestAnimationFrame(() => {
          xterm.current.fit();
        });
      }
    });

    resizeObserver.observe(container.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Restore document title on unmount
  useEffect(() => {
    return () => {
      document.title = originalTitle.current;
    };
  }, []);

  if (!features?.ttyd || !connected)
    return (
      <FeatureNotSupported>
        <div className="mt-3">
          <Markdown>{TTYD_NOT_SUPPORTED_MSG}</Markdown>
        </div>
      </FeatureNotSupported>
    );

  return (
    <div className="h-[calc(100vh-5.5rem)] pl-2 pr-2 pb-4">
      <Card
        className="h-full rounded-2xl shadow-xl overflow-hidden"
        style={{
          backgroundColor:
            themeColor === "dark"
              ? darkTermColors.background
              : lightTermColors.background,
        }}
      >
        <CardContent className="h-full p-0">
          <div className="h-full p-2">
            <div
              ref={container}
              className="w-full h-full box-border"
              data-tour-id={TOUR_STEP_IDS.TERMINAL}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Terminal;
