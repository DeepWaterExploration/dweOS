/* The Device object is the same as the one defined in the backend */
export interface Device {
  cameras: Camera[];
  controls: Control[];
  info: {
    name: string;
    /* Differenciator between cameras (device path) */
    path: string;
    pid: string;
    manufacturer: string;
    model: string;
    // Add more properties if needed
  };
  options: {
    bitrate: number;
    gop: number;
    mode: string;
    // Add more properties if needed
  };
  stream: {
    device_path: string;
    encode_type: encodeType;
    stream_type: streamType;
    // Add more properties if needed
  };
}

interface Camera {
  device_path: string;
  formats: CameraFormat[];
}

interface CameraFormat {
  format: string;
  sizes: CameraSize[];
}

export interface CameraSize {
  height: number;
  intervals: CameraInterval[];
  width: number;
}

interface CameraInterval {
  /* The stream interval numerator */
  numerator: number;
  /* The stream interval denominator */
  denominator: number;
}

interface Control {
  flags: CameraFlags; // Update the type if possible
  id: number;
  name: string;
}

interface CameraFlags {
  default_value: number;
  disabled: boolean;
  grabbed: boolean;
  max: number;
  min: number;
  read_only: boolean;
  slider: number;
  step: number;
  type: number;
  update: number;
  volatility: number;
  write_only: boolean;
}

/* If we ever need to add more compression formats, just add them here */
export enum encodeType {
  MJPEG = "MJPEG",
  H264 = "H264",
}

/* If we ever need to support more stream protocols, just add them here */
export enum streamType {
  TCP = "TCP",
  UDP = "UDP",
}

/**
 * Retrieves a list of devices connected to the system
 * @returns {Promise<Device[]>} - A promise that resolves to an array of Device objects.
 * @throws {Error} - If the request to retrieve the device list fails.
 */
export async function getDevices(): Promise<Device[]> {
  const url = "http://localhost:8080/devices";
  const config: RequestInit = {
    mode: "cors",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    // credentials: "include",
  };
  return await fetch(url, config)
    // Process the response data
    .then((response: Response) => response.json())
    .then((data: Device[]) => {
      return data;
    })
    .catch((error: Error) => {
      console.log("Failed to retrieve device list");
      console.error(error);
      return [];
    });
}

/**
 * Retrieves the information for a specific device by index. If the device is not found, returns an empty object.
 * @param {number} id - The index of the connected camera.
 * @returns {Promise<Device[]>} - A promise that resolves to a Device object.
 * @throws {Error} - If the request to retrieve the device fails.
 */
export async function getDevice(id: number): Promise<Device> {
  const url = `http://localhost:8080/devices/${id}`;
  const config: RequestInit = {
    mode: "cors",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    // credentials: "include",
  };
  return await fetch(url, config)
    // Process the response data
    .then((response: Response) => response.json())
    .then((data: Device) => {
      return data;
    })
    .catch((error: Error) => {
      console.log(`Failed to retrieve device ${id}`);
      console.error(error);
      return {} as Device;
    });
}

/**
 * Represents a stream format.
 */
interface Format {
  /* The pixel format of the stream */
  format: format;
  /* The stream width */
  width: number;
  /* The stream height */
  height: number;
  /* The stream interval */
  interval: {
    /* The stream interval numerator */
    numerator: number;
    /* The stream interval denominator */
    denominator: number;
  };
}

/**
 * Configures a device stream with the provided settings.
 * @param {number} index - The index of the connected camera.
 * @param {Format} format - The format of the stream.
 * @throws {Error} - If the request to configure the device fails.
 */
export async function setDevice(id: number, format: Format) {
  const url = `http://localhost:8080/devices/${id}`;
  const config: RequestInit = {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // credentials: "include",
    body: JSON.stringify(format),
  };
  return await fetch(url, config)
    // Process the response data
    .then((response: Response) => response.json())
    .then((data: Device) => {
      return data;
    })
    .catch((error: Error) => {
      console.log(`Failed to configure device ${id}`);
      console.error(error);
      return {} as Device;
    });
}

/**
 * Represents a stream endpoint.
 */
interface Endpoint {
  /* The stream endpoint host */
  host: string;
  /* The stream endpoint port */
  port: number;
}

/**
 * Add a stream endpoint to a device.
 * @param {number} index - The index of the connected camera.
 * @param {Endpoint} endpoint - The stream endpoint object.
 * @returns {Promise<void>} - A promise that resolves when the stream endpoint is successfully added.
 * @throws {Error} - If the index is invalid or the request fails.
 */
export async function addStreamEndpoint(
  index: number,
  endpoint: Endpoint
): Promise<void> {
  const url = "http://localhost:8080/add_stream_endpoint";
  const data = {
    index,
    endpoint,
  };
  const config: RequestInit = {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // credentials: "include",
    body: JSON.stringify(data),
  };

  return await fetch(url, config)
    // Process the response data
    .then((response: Response) => {
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Error: Invalid index");
        }
        throw new Error("Failed to add stream endpoint");
      }
    })
    .catch((error: Error) => {
      console.log("Failed to add stream endpoint");
      console.error(error);
    });
}

/**
 * Start a stream on a device.
 * @param {number} index - The index of the connected camera.
 * @returns {Promise<void>} - A promise that resolves when the stream is successfully started.
 * @throws {Error} - If the index is invalid or the request fails.
 */
export async function startStream(index: number): Promise<void> {
  const url = "http://localhost:8080/start_stream";
  const data = {
    index,
  };
  const config: RequestInit = {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // credentials: "include",
    body: JSON.stringify(data),
  };

  return await fetch(url, config)
    // Process the response data
    .then((response: Response) => {
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Error: Invalid index");
        }
        throw new Error("Failed to start stream");
      }
    })
    .catch((error: Error) => {
      console.log("Failed to start stream");
      console.error(error);
    });
}

/**
 * Stop a stream on a device.
 * @param {number} index - The index of the connected camera.
 * @returns {Promise<void>} - A promise that resolves when the stream is successfully stopped.
 * @throws {Error} - If the index is invalid or the request fails.
 */
export async function stopStream(index: number): Promise<void> {
  const url = "http://localhost:8080/stop_stream";
  const data = {
    index,
  };
  const config: RequestInit = {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // credentials: "include",
    body: JSON.stringify(data),
  };

  return await fetch(url, config)
    // Process the response data
    .then((response: Response) => {
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Error: Invalid index");
        }
        throw new Error("Failed to stop stream");
      }
    })
    .catch((error: Error) => {
      console.log("Failed to stop stream");
      console.error(error);
    });
}

/**
 * Represents a UVC control.
 */
interface Control {
  /* The control ID */
  id: number;
  /* The control value */
  value: number;
}

/**
 * Set a UVC control on a device.
 * @param {number} index - The index of the connected camera.
 * @param {Control} control - The control to set.
 * @param {number} value - The value to set the control to.
 * @returns {Promise<void>} - A promise that resolves when the control is successfully set.
 * @throws {Error} - If the index is invalid or the request fails.
 */
export async function setUVCControl(
  index: number,
  control: Control
): Promise<void> {
  const url = "http://localhost:8080/set_uvc_control";
  const data = {
    index,
    control,
  };
  const config: RequestInit = {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // credentials: "include",
    body: JSON.stringify(data),
  };

  return await fetch(url, config)
    // Process the response data
    .then((response: Response) => {
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Error: Invalid index");
        }
        throw new Error("Failed to set UVC control");
      }
    })
    .catch((error: Error) => {
      console.log("Failed to set UVC control");
      console.error(error);
    });
}

/**
 * Configure exploreHD option on a device.
 * @param {number} index - The index of the connected camera.
 * @param {number} option - The option to set.
 * @param {number} value - The value to set the option to.
 * @returns {Promise<void>} - A promise that resolves when the option is successfully set.
 * @throws {Error} - If the index is invalid or the request fails.
 */
export async function setExploreHDOption(index: number): Promise<void> {
  const url = "http://localhost:8080/set_explorehd_option";
  const data = {
    index,
  };
  const config: RequestInit = {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // credentials: "include",
    body: JSON.stringify(data),
  };

  return await fetch(url, config)
    // Process the response data
    .then((response: Response) => {
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Error: Invalid index");
        }
        throw new Error("Failed to set exploreHD option");
      }
    })
    .catch((error: Error) => {
      console.log("Failed to set exploreHD option");
      console.error(error);
    });
}

/**
 * Restore a device to factory settings.
 */
export async function resetSettings(): Promise<void> {
  const url = "http://localhost:8080/reset_settings";
  const config: RequestInit = {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // credentials: "include",
  };

  return await fetch(url, config)
    // Process the response data
    .then((response: Response) => {
      if (!response.ok) {
        throw new Error("Failed to reset settings");
      }
      window.location.reload();
    })
    .catch((error: Error) => {
      console.log("Failed to reset settings");
      console.error(error);
    });
}
