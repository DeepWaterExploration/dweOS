import { SYSTEM_API_URL } from "../../../utils/api";
import {
  ConnectToWifiResponse,
  GetAvailableWifiResponse,
  GetConnectedNetworkResponse,
  GetSavedWifiResponse,
  GetWifiStatusResponse,
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
  networks: WiFiNetwork[]
): Promise<WiFiNetwork | null> {
  const url = `${SYSTEM_API_URL}/getConnectedNetwork`;
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
      if (!(data.network === "")) {
        const connectedNetwork = networks.find((network: WiFiNetwork) => {
          return network.ssid === data.network;
        });
        if (connectedNetwork) {
          return connectedNetwork;
        }
      }
      return null;
    })
    .catch((error: Error) => {
      console.log("Failed to get connected networks");
      console.error(error);
      return {} as WiFiNetwork;
    });
}

/**
 * Gets the list of available wifi networks.
 * @returns {Promise<WiFiNetwork[]>} - A promise that resolves to the result of the request.
 * @throws {Error} - If the request to get the list of available wifi networks fails.
 */
export async function getAvailableWifi(): Promise<WiFiNetwork[]> {
  const url = `${SYSTEM_API_URL}/getAvailableWifi`;
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
      console.log(data);
      return data.available_networks as WiFiNetwork[];
    })
    .catch((error: Error) => {
      console.log("Failed to get available wifi networks");
      console.error(error);
      return {} as WiFiNetwork[];
    });
}

/**
 * Gets the list of wifi networks saved on the device.
 * @returns {Promise<WiFiNetwork[]>} - A promise that resolves to the result of the request.
 * @throws {Error} - If the request to get the list of saved wifi networks fails.
 */
export async function getSavedWifi(): Promise<WiFiNetwork[]> {
  const url = `${SYSTEM_API_URL}/getSavedWifi`;
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
      return data.saved_networks as WiFiNetwork[];
    })
    .catch((error: Error) => {
      console.log("Failed to get wifi capability status");
      console.error(error);
      return {} as WiFiNetwork[];
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
  const url = `${SYSTEM_API_URL}/forgetNetwork`;
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
