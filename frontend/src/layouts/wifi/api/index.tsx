import { SYSTEM_API_URL } from "../../../utils/api";
import { WifiStatus, ScannedWifiNetwork } from "../types";

// Begin GET Requests
/**
 * Gets whether wifi is enabled on the device.
 * @returns {Promise<GetWifiStatusResponse>} - A promise that resolves to the result of the request.
 * @throws {Error} - If the request to get the wifi status fails.
 */
export async function getWifiStatus(): Promise<WifiStatus> {
    const url = `${SYSTEM_API_URL}/wifiStatus`;
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
        .then((data: WifiStatus) => {
            return data;
        })
        .catch((error: Error) => {
            console.log("Failed to get wifi capability status");
            console.error(error);
            return {} as WifiStatus;
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
        .then((data: ScannedWifiNetwork[]) => {
            return data as ScannedWifiNetwork[];
        })
        .catch((error: Error) => {
            console.log("Failed to get available wifi networks");
            console.error(error);
            return {} as ScannedWifiNetwork[];
        });
}
