import { components } from "@/schemas/dwe_os_2";

export function getStreamFromStreamInfo(
  stream: components["schemas"]["StreamModel"],
  streamInfo: components["schemas"]["StreamInfoModel"],
): components["schemas"]["StreamModel"] {
  return {
    device_path: stream.device_path,
    enabled: streamInfo.enabled,
    encode_type: streamInfo.encode_type,
    endpoints: streamInfo.endpoints,
    stream_type: streamInfo.stream_type,
    width: streamInfo.stream_format.width,
    height: streamInfo.stream_format.height,
    interval: streamInfo.stream_format.interval,
  };
}
