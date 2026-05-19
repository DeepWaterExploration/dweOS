import { components } from "@/schemas/dwe_os_2";

export type RecordingInfo = components["schemas"]["RecordingInfo"];

export const DEMO_RECORDING: RecordingInfo = {
  path: "",
  name: "Demo Recording",
  format: "mp4",
  duration: "00:00:00",
  size: "0",
  created: new Date().toISOString(),
};

export const formatFileSize = (sizeInMB: number): string => {
  if (sizeInMB >= 1024 * 1024) {
    return `${(sizeInMB / (1024 * 1024)).toFixed(2)} TB`;
  } else if (sizeInMB >= 1024) {
    return `${(sizeInMB / 1024).toFixed(2)} GB`;
  } else {
    return `${sizeInMB.toFixed(2)} MB`;
  }
};

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const fullName = (rec: RecordingInfo) => `${rec.name}.${rec.format}`;

export const isPlayable = (rec: RecordingInfo) => rec.format === "mp4";

export const getRecordingStreamUrl = (rec: RecordingInfo, baseUrl: string) =>
  `${baseUrl}/api/recordings/${encodeURIComponent(fullName(rec))}`;
