import {
  Device,
  ReleaseList,
  Stream,
  StreamEndpoint,
  StreamFormat,
  bitrateMode,
  encodeType,
  optionType,
} from "../types/types";

const hostAddress: string = window.location.hostname;
export const DEVICE_API_URL = `http://${hostAddress}:8080`;
export const DEVICE_API_WS = `ws://${hostAddress}:9002`;
export const SYSTEM_API_URL = `http://${hostAddress}:5050`;
export const UPDATER_API_URL = `http://${hostAddress}:5000`;

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
 * @param {number} usbInfo - The usb info of the connected camera.
 * @throws {Error} - If the request to configure the device fails.
 */
export async function unconfigureStream(usbInfo: string) {
  const url = `${DEVICE_API_URL}/unconfigure_stream`;
  const body = {
    usbInfo,
  };
  const config: RequestInit = {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // credentials: "include",
    body: JSON.stringify(body),
  };
  return await fetch(url, config)
    // Process the response data
    .then((response: Response) => response.json())
    .then(() => {
      return;
    })
    .catch((error: Error) => {
      console.log(`Failed to configure device ${usbInfo}`);
      console.error(error);
      return;
    });
}

/**
 * Configures a device stream with the provided settings.
 * @param {number} usbInfo - The usb info of the connected camera.
 * @param {StreamFormat} format - The format of the stream.
 * @param {encodeType} encode_type - The encode type of the stream.
 * @throws {Error} - If the request to configure the device fails.
 */
export async function configureStream(
  bus_info: string,
  stream_format: StreamFormat,
  encode_type: encodeType,
  endpoints: StreamEndpoint[]
) {
  const url = `${DEVICE_API_URL}/devices/configure_stream`;
  const body = {
    bus_info,
    stream_format,
    encode_type,
    endpoints,
  };
  const config: RequestInit = {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // credentials: "include",
    body: JSON.stringify(body),
  };
  return await fetch(url, config)
    // Process the response data
    .then((response: Response) => response.json())
    .then((data: Stream) => {
      return data;
    })
    .catch((error: Error) => {
      console.log(`Failed to configure device ${bus_info}`);
      console.error(error);
      return undefined;
    });
}

/**
 * Set a device nickname
 * @param {string} usbInfo - The usb info of the connected camera.
 * @param {string} nickname
 * @throws {Error} - If the request to configure the device fails.
 */
export async function setDeviceNickname(bus_info: string, nickname: string) {
  const url = `${DEVICE_API_URL}/devices/set_nickname`;
  const body = {
    bus_info,
    nickname,
  };
  const config: RequestInit = {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // credentials: "include",
    body: JSON.stringify(body),
  };
  return await fetch(url, config)
    // Process the response data
    .then((response: Response) => response.json())
    .then((data: Stream) => {
      return data;
    })
    .catch((error: Error) => {
      console.log(`Failed to configure device ${bus_info}`);
      console.error(error);
      return undefined;
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
 * @param {number} usbInfo - The usb info of the connected camera.
 * @param {number} option - The option to set.
 * @param {number} value - The value to set the option to.
 * @returns {Promise<void>} - A promise that resolves when the option is successfully set.
 * @throws {Error} - If the index is invalid or the request fails.
 */
export async function setExploreHDOption(
  bus_info: string,
  option: optionType,
  value: number
): Promise<void> {
  const url = `${DEVICE_API_URL}/devices/set_option`;
  const data = {
    bus_info,
    option,
    value,
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
 * Restart a stream
 * @param {number} usbInfo - The usb info of the connected camera.
 * @returns {Promise<void>} - A promise that resolves when the option is successfully set.
 * @throws {Error} - If the index is invalid or the request fails.
 */
export async function restartStream(usbInfo: string): Promise<void> {
  const url = `${DEVICE_API_URL}/restart_stream`;
  const data = {
    usbInfo,
  };
  const config: RequestInit = {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    // credentials: "include",
  };

  return await fetch(url, config)
    // Process the response data
    .then((response: Response) => {
      if (!response.ok) {
        throw new Error("Failed to restart stream");
      }
    })
    .catch((error: Error) => {
      console.log("Failed to restart stream");
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
 * Request to shut down the machine.
 * @throws {Error} - If the request to shut down the machine fails.
 */
export async function shutDownMachine(): Promise<null> {
  const url = `${SYSTEM_API_URL}/shutDownMachine`;
  const config: RequestInit = {
    mode: "cors",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  await fetch(url, config).catch((error: Error) => {
    console.log("Failed to restart device");
    console.error(error);
    throw error;
  });
  return null;
}

/**
 * Request to restart the machine.
 * @returns {Promise<null>} - A promise that resolves when the machine is successfully restarted.
 * @throws {Error} - If the request to restart the machine fails.
 */
export async function restartMachine(): Promise<null> {
  const url = `${SYSTEM_API_URL}/restartMachine`;
  const config: RequestInit = {
    mode: "cors",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  await fetch(url, config).catch((error: Error) => {
    console.log("Failed to restart device");
    console.error(error);
    throw error;
  });
  return null;
}

export async function installUpdate(tag_name: string): Promise<null> {
  const url = `${UPDATER_API_URL}/install_update`;
  const data = {
    tag_name,
  };
  const config: RequestInit = {
    mode: "cors",
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  };
  await fetch(url, config).catch((error: Error) => {
    console.log("Failed to restart device");
    console.error(error);
    throw error;
  });
  return null;
}

export async function getReleases(): Promise<ReleaseList> {
  const url = `${UPDATER_API_URL}/releases`;
  const config: RequestInit = {
    mode: "cors",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  return await fetch(url, config)
    .then((response: Response) => response.json())
    .then((data: ReleaseList) => {
      return data;
    })
    .catch((error: Error) => {
      console.log("Failed to restart device");
      console.error(error);
      throw error;
    });
}
