import { useContext, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import WebsocketContext from "@/contexts/WebsocketContext";
import type { components } from "@/schemas/dwe_os_2";

type LogSchema = components["schemas"]["LogSchema"];

/** Levels that show a toast */
const TOAST_LEVELS = new Set(["WARNING", "ERROR", "CRITICAL"]);

function truncate(text: string, maxLen: number) {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}

function logToToast(log: LogSchema) {
  const level = log.level.toUpperCase();
  if (!TOAST_LEVELS.has(level)) return;

  const destructive = level === "ERROR" || level === "CRITICAL";
  const title = `${log.level} · ${log.name}`;
  const description = truncate(
    `${log.message}\n${log.filename}:${log.lineno} · ${log.function}()`,
    320,
  );

  toast({
    title,
    description,
    variant: destructive ? "destructive" : "default",
  });
}

/**
 * Subscribes to Socket.IO `log` events (same stream as the log viewer) and shows
 * WARNING+ entries as toasts. Requires `WebsocketContext`.
 */
export function useLogSocketToasts() {
  const ws = useContext(WebsocketContext);
  const socket = ws?.socket;
  const connected = ws?.connected ?? false;

  useEffect(() => {
    if (!connected || !socket) return;

    const onLog = (log: LogSchema) => {
      logToToast(log);
    };

    socket.on("log", onLog);
    return () => {
      socket.off("log", onLog);
    };
  }, [connected, socket]);
}
