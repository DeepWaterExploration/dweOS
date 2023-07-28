import { SYSTEM_API_URL } from "../../../utils/api";
import { base64Encode } from "../../../utils/formatNumber";
import { ConnectToWifiResponse, GetWifiStatusResponse } from "../types";

/**
 * Gets whether wifi is enabled on the device.
 * @returns {Promise<GetWifiStatusResponse>} - A promise that resolves to the result of the request.
 * @throws {Error} - If the request to get the wifi status fails.
 */
export async function getWifiStatus(): Promise<boolean> {
  const url = `${SYSTEM_API_URL}/getWifiStatus`;
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
    .then((data: GetWifiStatusResponse) => {
      return data.enabled as boolean;
    })
    .catch((error: Error) => {
      console.log("Failed to get wifi capability status");
      console.error(error);
      return false;
    });
}

/**
 * Toggles the wifi capability of the device.
 * @returns {Promise<GetWifiStatusResponse>} - A promise that resolves to the result of the request.
 * @throws {Error} - If the request to toggle the wifi fails.
 */
export async function toggleWifiStatus(wifiStatus: boolean): Promise<boolean> {
  const url = `${SYSTEM_API_URL}/toggleWifiStatus`;
  const data = {
    wifi_status: wifiStatus,
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
    .then((response: Response) => response.json())
    .then((data: GetWifiStatusResponse) => {
      console.log(data.enabled);
      return data.enabled as boolean;
    })
    .catch((error: Error) => {
      console.log("Failed to toggle wifi");
      console.error(error);
      return false;
    });
}

/**
 * Connect to a wifi network.
 * @returns {Promise<ConnectToWifiResponse>} - A promise that resolves to the result of the connection attempt.
 * @throws {Error} - If the request to connect to the network fails.
 */
export async function connectToWifi(
  wifi_ssid: string,
  wifi_password: string
): Promise<ConnectToWifiResponse> {
  // encode wifi_ssid and wifi_password
  wifi_ssid = base64Encode(wifi_ssid);
  wifi_password = base64Encode(wifi_password);
  const url = `${SYSTEM_API_URL}/connectToWifi`;
  const data = {
    wifi_ssid,
    wifi_password,
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
    .then((response: Response) => response.json())
    .then((data: ConnectToWifiResponse) => {
      return data;
    })
    .catch((error: Error) => {
      console.log("Failed to connect to wifi");
      console.error(error);
      return {} as ConnectToWifiResponse;
    });
}
