import fetch from "node-fetch";

/* The Device object is the same as the one defined in the backend */
interface Device {
  id: string;
  name: string;
  type: string;
}

/* If we ever need to add more formats, just add them here */
export enum format {
  MJPEG = "MJPEG",
  H264 = "H264",
}

interface Format {
  format: format;
  width: number;
  height: number;
  interval: {
    numerator: number;
    denominator: number;
  };
}

/**
 * Retrieves a list of devices connected to the system
 * @returns {Promise<Device[]>} - A promise that resolves to an array of Device objects.
 * @throws {Error} - If the request to retrieve the device list fails.
 */
export async function getDevices(): Promise<Device[]> {
  const url = "/devices";
  const config = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  try {
    return await fetch(url, config)
      // Process the response data
      .then(response => response.json())
      .then(data => data as Device[]);
  } catch (error) {
    console.log("Failed to retrieve device list");
    console.error(error);
    return [];
  }
}

/**
 * Retrieves the information for a specific device by index. If the device is not found, returns an empty object.
 * @param {number} id - The index of the connected camera.
 * @returns {Promise<Device[]>} - A promise that resolves to a Device object.
 * @throws {Error} - If the request to retrieve the device fails.
 */
export async function getDevice(id: number): Promise<Device> {
  const url = `/devices/${id}`;
  const config = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  try {
    return await fetch(url, config)
      // Process the response data
      .then(response => response.json())
      .then(data => data as Device);
  } catch (error) {
    console.log(`Failed to retrieve device ${id}`);
    console.error(error);
    return {} as Device;
  }
}

/**
 * Configures a device stream with the provided settings.
 * @param {number} id - The index of the connected camera.
 * @param {any} format - The format of the stream.
 * @param {string} format.format - The pixel format of the stream.
 * @param {number} format.width - The stream width.
 * @param {number} format.height - The stream height.
 * @param {number} format.interval - The stream interval.
 * @param {number} format.interval.numerator - The stream interval numerator.
 * @param {number} format.interval.denominator - The stream interval denominator.
 * @throws {Error} - If the request to configure the device fails.
 */
export async function setDevice(id: number, format: Format) {
  const url = `/devices/${id}`;
  const config = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(format),
  };
  try {
    return await fetch(url, config);
  } catch (error) {
    console.log(`Failed to configure device ${id}`);
    console.error(error);
  }
}
