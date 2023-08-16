import { SYSTEM_API_URL } from "../../../utils/api";
import {
  ConnectToWifiResponse,
  ConnectedWifiNetwork,
  ForgetWifiResponse,
  GetAvailableWifiResponse,
  GetConnectedNetworkResponse,
  GetSavedWifiResponse,
  GetWifiStatusResponse,
  SavedWifiNetwork,
  ScannedWifiNetwork,
  WiFiInterface,
  WiFiInterfaces,
  WiFiNetwork,
} from "../types";

// Begin GET Requests
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

export async function getConnectedNetwork(
  ): Promise<ConnectedWifiNetwork | null> {
  const url = `${SYSTEM_API_URL}/wifiConnected`;
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
    .then((data: GetConnectedNetworkResponse) => {
      return data.connected_network as ConnectedWifiNetwork;
    })
    .catch((error: Error) => {
      console.log("Failed to get connected networks");
      console.error(error);
      return null;
    });
}

/**
 * Gets the list of available wifi networks.
 * @returns {Promise<WiFiNetwork[]>} - A promise that resolves to the result of the request.
 * @throws {Error} - If the request to get the list of available wifi networks fails.
 */
export async function getAvailableWifi(): Promise<ScannedWifiNetwork[]> {
  const url = `${SYSTEM_API_URL}/wifiScan`;
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
    .then((data: GetAvailableWifiResponse) => {
      console.log(data.available_networks);
      return data.available_networks as ScannedWifiNetwork[];
    })
    .catch((error: Error) => {
      console.log("Failed to get available wifi networks");
      console.error(error);
      return {} as ScannedWifiNetwork[];
    });
}

/**
 * Gets the list of wifi networks saved on the device.
 * @returns {Promise<SavedWifiNetwork[]>} - A promise that resolves to the result of the request.
 * @throws {Error} - If the request to get the list of saved wifi networks fails.
 */
export async function getSavedWifi(): Promise<SavedWifiNetwork[]> {
  const url = `${SYSTEM_API_URL}/wifiSaved`;
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
    .then((data: GetSavedWifiResponse) => {
      return data.saved_networks as SavedWifiNetwork[];
    })
    .catch((error: Error) => {
      console.log("Failed to get wifi capability status");
      console.error(error);
      return {} as SavedWifiNetwork[];
    });
}

// Begin POST Requests
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
  wifi_ssid = btoa(wifi_ssid);
  wifi_password = btoa(wifi_password);
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
      return data.enabled;
    })
    .catch((error: Error) => {
      console.log("Failed to toggle wifi");
      console.error(error);
      return false;
    });
}

/**
 * Toggles the wifi capability of the device.
 * @returns {Promise<GetWifiStatusResponse>} - A promise that resolves to the result of the request.
 * @throws {Error} - If the request to toggle the wifi fails.
 */
export async function forgetNetwork(wifi_ssid: string): Promise<boolean> {
  const url = `${SYSTEM_API_URL}/wifiForget`;
  const data = {
    wifi_ssid: wifi_ssid,
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
    .then((data: ForgetWifiResponse) => {
      return data.success;
    })
    .catch((error: Error) => {
      console.log(`Failed to forget ${wifi_ssid}`);
      console.error(error);
      return false;
    });
}

/**
 * Toggles the wifi capability of the device.
 * @returns {Promise<GetWifiStatusResponse>} - A promise that resolves to the result of the request.
 * @throws {Error} - If the request to toggle the wifi fails.
 */
export async function disconnectNetwork(wifi_ssid: string): Promise<boolean> {
  const url = `${SYSTEM_API_URL}/disconnectNetwork`;
  const data = {
    wifi_ssid: wifi_ssid,
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
      return data.enabled;
    })
    .catch((error: Error) => {
      console.log(`Failed to forget ${wifi_ssid}`);
      console.error(error);
      return false;
    });
}
