import {
  CPUInfo,
  Control,
  Device,
  StreamEndpoint,
  StreamFormat,
} from "../types/types";

const DEVICE_API_URL = "http://localhost:8080";
const SYSTEM_API_URL = "http://localhost:5050";

/**
 * Retrieves a list of devices connected to the system
 * @returns {Promise<Device[]>} - A promise that resolves to an array of Device objects.
 * @throws {Error} - If the request to retrieve the device list fails.
 */
export async function getDevices(): Promise<Device[]> {
  const url = `${DEVICE_API_URL}/devices`;
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
  const url = `${DEVICE_API_URL}/devices/${id}`;
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
 * Configures a device stream with the provided settings.
 * @param {number} index - The index of the connected camera.
 * @param {StreamFormat} format - The format of the stream.
 * @throws {Error} - If the request to configure the device fails.
 */
export async function setDevice(id: number, format: StreamFormat) {
  const url = `${DEVICE_API_URL}/devices/${id}`;
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
 * Add a stream endpoint to a device.
 * @param {number} index - The index of the connected camera.
 * @param {Endpoint} endpoint - The stream endpoint object.
 * @returns {Promise<void>} - A promise that resolves when the stream endpoint is successfully added.
 * @throws {Error} - If the index is invalid or the request fails.
 */
export async function addStreamEndpoint(
  index: number,
  endpoint: StreamEndpoint
): Promise<void> {
  const url = `${DEVICE_API_URL}/add_stream_endpoint`;
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
  const url = `${DEVICE_API_URL}/start_stream`;
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
  const url = `${DEVICE_API_URL}/stop_stream`;
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
 * Set a UVC control on a device.
 * @param {number} index - The index of the connected camera.
 * @param {Control} control - The control to set.
 * @param {number} value - The value to set the control to.
 * @returns {Promise<void>} - A promise that resolves when the control is successfully set.
 * @throws {Error} - If the index is invalid or the request fails.
 */
export async function setUVCControl(
  usbInfo: string,
  value: number,
  id: number
): Promise<void> {
  const url = `${DEVICE_API_URL}/devices/set_uvc_control`;
  const data = {
    usbInfo,
    control: {
      value,
      id,
    },
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
  const url = `${DEVICE_API_URL}/set_explorehd_option`;
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
  const url = `${DEVICE_API_URL}/reset_settings`;
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

/**
 * Retrieves information about the CPU and its usage from the system.
 * @returns {Promise<CPUInfo>} - A promise that resolves to an array of Device objects.
 * @throws {Error} - If the request to retrieve the device list fails.
 */
export async function getCPUInfo(): Promise<CPUInfo> {
  const url = `${SYSTEM_API_URL}/getCPU`;
  const config: RequestInit = {
    mode: "cors",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  return await fetch(url, config)
    // Process the response data
    .then((response: Response) => response.json())
    .then((data: CPUInfo) => {
      return data;
    })
    .catch((error: Error) => {
      console.log("Failed to retrieve device list");
      console.error(error);
      return {} as CPUInfo;
    });
}
