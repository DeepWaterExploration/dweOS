import { components } from "@/schemas/dwe_os_2";

type Log = components["schemas"]["LogSchema"];

// "2026-10-15 05:14:50.293" -> ["2026-10-15", "05:14:50.293"]. The backend
// uses "." before the milliseconds; Python's logging default is ",".
export function splitTimestamp(timestamp: string): [string, string] {
  const match = timestamp.match(
    /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(?:[.,](\d+))?/,
  );
  if (!match) return [timestamp, ""];
  return [match[1], match[3] ? `${match[2]}.${match[3]}` : match[2]];
}

/**
 * One log for the clipboard, like the backend's log file but with the message
 * on its own line:
 * "<timestamp> <LEVEL> [<logger>] <file>:<line> <function>():\n<message>"
 */
export function formatLogForCopy(log: Log): string {
  return `${log.timestamp} ${log.level} [${log.name}] ${log.filename}:${log.lineno} ${log.function}():\n${log.message}`;
}

// RFC 4180: quote fields containing a delimiter, quote or line break
const csvField = (value: string | number): string => {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** CSV with the same columns as the logs table, plus a BOM so Excel reads it as UTF-8 */
export function logsToCsv(logs: Log[]): string {
  const header = [
    "Date",
    "Time",
    "Level",
    "Logger",
    "File",
    "Line",
    "Function",
    "Message",
  ];
  const rows = logs.map((log) => [
    ...splitTimestamp(log.timestamp),
    log.level,
    log.name,
    log.filename,
    log.lineno,
    log.function,
    log.message,
  ]);
  return (
    "\ufeff" +
    [header, ...rows]
      .map((row) => row.map(csvField).join(",") + "\r\n")
      .join("")
  );
}

export function getLogExportFileName(now: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const stamp =
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `T${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `dweos-logs-${stamp}.csv`;
}

export function downloadFile(
  fileName: string,
  contents: string,
  type: string,
): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * navigator.clipboard only exists on secure origins (HTTPS or localhost), and
 * dweOS is usually opened over plain HTTP on the vehicle's IP, so fall back to
 * the legacy copy command there.
 */
export async function copyText(text: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy path
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
