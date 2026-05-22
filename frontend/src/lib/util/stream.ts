import { components } from "@/schemas/dwe_os_2";

export const getResolution = (resolution: string) => {
  const split = resolution.split("x");
  if (split.length < 2) return [null, null];
  return [parseInt(split[0]), parseInt(split[1])];
};

export const resolutionToString = (width: number, height: number) => {
  return `${width}x${height}`;
};

export const getEncoders = (device: components["schemas"]["DeviceModel"]) => {
  console.log(`Getting encoders for device: ${device.bus_info}`);
  return new Set(
    (device.cameras ?? []).flatMap((cam) => Object.keys(cam.formats)),
  );
};

export const canLead = (device: components["schemas"]["DeviceModel"]) => {
  // TODO: switch from magic numbers
  return (
    device.device_type == 1 || (device.device_type === 2 && !device.is_managed)
  );
};

export const canFollow = (device: components["schemas"]["DeviceModel"]) => {
  return device.device_type === 2 && !device.is_managed;
};

export const getAvailableIntervals = (
  device: components["schemas"]["DeviceModel"],
) => {
  const cameraFormat = device.stream.encode_type;

  const availableIntervals = new Set(
    (device.cameras ?? [])
      .flatMap((camera) => camera.formats[cameraFormat] ?? [])
      .flatMap((resolution) => resolution.intervals ?? [])
      .map((interval) => interval.denominator.toString()),
  );

  return availableIntervals;
};

/*
 * Get the list of resolutions available from the device
 */
export const getResolutions = (
  device: Readonly<components["schemas"]["DeviceModel"]>,
) => {
  const newResolutions: string[] = [];

  for (const camera of device.cameras!) {
    const format = camera.formats[device.stream.encode_type];
    if (format) {
      for (const resolution of format) {
        const resolution_str = `${resolution.width}x${resolution.height}`;
        if (newResolutions.includes(resolution_str)) continue;
        newResolutions.push(resolution_str);
      }
    }
  }
  return newResolutions;
};
