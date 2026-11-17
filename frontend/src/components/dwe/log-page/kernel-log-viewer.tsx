"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Search, Download, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import WebsocketContext from "@/contexts/WebsocketContext";
import { API_CLIENT } from "@/api";
import { components } from "@/schemas/dwe_os_2";
import {
  downloadFile,
  formatKernelLog,
  kernelLogsToText,
} from "@/lib/util/logs";

type KernelLog = components["schemas"]["KernelLogEntry"];

// Most severe first; selecting a level shows it and everything more severe
const LEVELS = [
  "EMERG",
  "ALERT",
  "CRIT",
  "ERR",
  "WARNING",
  "NOTICE",
  "INFO",
  "DEBUG",
];
const MAX_LOGS = 5000;

const levelClass = (level: string) => {
  const severity = LEVELS.indexOf(level);
  if (severity <= 3) return "text-red-500";
  if (severity === 4) return "text-yellow-500";
  if (severity >= 7) return "text-muted-foreground";
  return "";
};

export function KernelLogViewer() {
  const { connected, socket } = useContext(WebsocketContext)!;
  const [logs, setLogs] = useState<KernelLog[]>([]);
  const [available, setAvailable] = useState(true);
  const [level, setLevel] = useState("DEBUG");
  const [query, setQuery] = useState("");
  // Stick to the newest entry while scrolled to the bottom; scrolling up
  // detaches until the user jumps back down
  const [atBottom, setAtBottom] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!connected || !socket) {
      setLogs([]);
      return;
    }
    let cancelled = false;
    const onLogs = (incoming: KernelLog[]) =>
      setLogs((prev) => {
        const last = prev.length ? prev[prev.length - 1].sequence : -1;
        return [...prev, ...incoming.filter((l) => l.sequence > last)].slice(
          -MAX_LOGS,
        );
      });
    // Subscribe first so nothing is missed; sequence numbers drop duplicates
    socket.on("kernel_log", onLogs);
    API_CLIENT.GET("/api/logs/kernel").then(({ data }) => {
      if (cancelled || !data) return;
      setAvailable(data.available);
      setLogs((prev) => {
        const seen = new Set(data.logs.map((l) => l.sequence));
        return [...data.logs, ...prev.filter((l) => !seen.has(l.sequence))];
      });
    });
    return () => {
      cancelled = true;
      socket.off("kernel_log", onLogs);
    };
  }, [connected, socket]);

  const filtered = useMemo(() => {
    const max = LEVELS.indexOf(level);
    const q = query.toLowerCase();
    return logs.filter(
      (l) =>
        LEVELS.indexOf(l.level) <= max && l.message.toLowerCase().includes(q),
    );
  }, [logs, level, query]);

  useEffect(() => {
    const el = scroller.current;
    if (atBottom && el) el.scrollTop = el.scrollHeight;
  }, [filtered, atBottom]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  };

  const jumpToLatest = () => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const exportLogs = () => {
    if (filtered.length === 0) {
      toast.info("No logs to export");
      return;
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadFile(
      `dweos-kernel-logs-${stamp}.txt`,
      kernelLogsToText(filtered),
      "text/plain",
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] gap-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Search className="h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search kernel logs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by level" />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      <div className="relative flex-1 min-h-0">
        <div
          ref={scroller}
          className="h-full overflow-auto rounded-md border p-2 font-mono text-xs"
          onScroll={onScroll}
        >
          {!available ? (
            <div className="p-6 text-center text-muted-foreground">
              Kernel logs are unavailable. dweOS needs permission to read
              /dev/kmsg (run as root, or on a host that exposes it).
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No kernel logs found matching your filters.
            </div>
          ) : (
            filtered.map((log) => (
              <div
                key={log.sequence}
                className={`whitespace-pre-wrap break-words ${levelClass(log.level)}`}
              >
                {formatKernelLog(log)}
              </div>
            ))
          )}
        </div>
        {!atBottom && (
          // Compact tab docked to the bottom edge of the log panel, centered
          <button
            type="button"
            onClick={jumpToLatest}
            className="absolute bottom-px left-1/2 flex h-7 -translate-x-1/2 items-center gap-1 rounded-t-md border border-b-0 bg-muted px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Jump to latest
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
