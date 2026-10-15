import { components } from "@/schemas/dwe_os_2";

/**
 * Lowest port at or above startPort that no camera's endpoints use yet, so a
 * new endpoint doesn't collide with another stream on the receiving end.
 */
export function getNextAvailablePort(
  devices: Record<string, components["schemas"]["DeviceModel"]>,
  startPort: number,
): number {
  const usedPorts = new Set(
    Object.values(devices).flatMap((device) =>
      device.stream.endpoints.map((endpoint) => endpoint.port),
    ),
  );

  let port = startPort;
  while (usedPorts.has(port)) port++;
  return port;
}

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
