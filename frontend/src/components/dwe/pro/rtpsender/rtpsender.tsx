import React, { useState, useEffect, useRef, useContext } from "react";
import { Play, Square, Eraser, Activity, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import WebsocketContext from "@/contexts/WebsocketContext";
import { API_CLIENT } from "@/api";

// Strict types
type ProcessStatus = "idle" | "starting" | "running" | "stopping";

const RTPSender: React.FC = () => {
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  const { socket, connected } = useContext(WebsocketContext)!;

  useEffect(() => {
    if (!connected) {
      setLogs([]);
      setStatus("idle");
    }

    if (connected) {
      socket?.on("sdk_log", (log: string) => {
        setLogs((prev) => [...prev, `${log}`]);
      });

      socket?.on("sdk_exit", (code: number) => {
        setLogs((prev) => [...prev, `SDK exited with status code: ${code}`]);
      });

      // TODO: add SDK start event
      API_CLIENT.GET("/api/rtpsender/status").then((data) => {
        setStatus(data.data ? "running" : "idle");
      });

      API_CLIENT.GET("/api/rtpsender/logs").then((logs) =>
        setLogs(logs.data || []),
      );
    }

    return () => {
      socket?.off("sdk_log");
      socket?.off("sdk_exit");
    };
  }, [connected, socket]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleStart = async () => {
    setStatus("starting");
    API_CLIENT.POST("/api/rtpsender/start_process")
      .then((data) => {
        setStatus(data.data ? "running" : "idle");
        if (data.data) setLogs((p) => [...p, `SYSTEM: Process started.`]);
        else {
          setLogs((p) => [...p, `ERROR: Could not start process: `]);
        }
      })
      .catch((e) => {
        setLogs((p) => [...p, `ERROR: Could not start process: ${e}`]);
        setStatus("idle");
      });
  };

  const handleStop = async () => {
    setStatus("stopping");
    API_CLIENT.POST("/api/rtpsender/stop_process").then((data) => {
      setStatus(data.data ? "idle" : "running");
      if (data.data) setLogs((p) => [...p, `SYSTEM: Process Stopped.`]);
      else {
        setLogs((p) => [...p, `ERROR: Could not stop process: `]);
      }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="w-full overflow-hidden rounded-xl border shadow-sm dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <TerminalSquare className="flex h-10 w-10 items-center justify-center text-zinc-500" />
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                SDK
              </h2>
              <div className="flex items-center gap-2">
                <span className={`relative flex h-2 w-2`}>
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${status === "running" ? "bg-emerald-400" : "hidden"}`}
                  ></span>
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${status === "running" ? "bg-emerald-500" : "bg-zinc-300"}`}
                  ></span>
                </span>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {status}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status === "running" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                className="h-9 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400"
              >
                <Square className="mr-2 h-4 w-4 fill-current" />
                Stop
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleStart}
                disabled={
                  status === "stopping" || status === "starting" || !connected
                }
                className="h-9 bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900"
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                Start Process
              </Button>
            )}
          </div>
        </div>

        {/* Terminal Area */}
        <div className="flex flex-col bg-zinc-950 text-zinc-400">
          {/* Terminal Toolbar */}
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 pt-2 pb-1 text-xs">
            <div className="flex items-center gap-2 text-zinc-500">
              <Activity className="h-3 w-3" />
              <span className="font-mono">stdout</span>
            </div>
            <button
              onClick={() => setLogs([])}
              className="flex items-center gap-1.5 rounded-sm px-2 py-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            >
              <Eraser className="h-3 w-3" />
              <span>Clear</span>
            </button>
          </div>

          {/* Logs */}
          <ScrollArea className="h-[400px] w-full p-4 font-mono text-xs sm:text-sm">
            {logs.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-700">
                <div className="h-1 w-1 rounded-full bg-zinc-800" />
                <p>Ready to connect...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className="flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300"
                  >
                    <span className="shrink-0 text-zinc-600 select-none">
                      {(i + 1).toString().padStart(3, "0")}
                    </span>
                    <span
                      className={`break-all ${log.includes("ERROR") ? "text-red-400" : log.includes("SYSTEM") ? "text-blue-400" : "text-zinc-300"}`}
                    >
                      {"> " + log}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} className="pb-4" />
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default RTPSender;
