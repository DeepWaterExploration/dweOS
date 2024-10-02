import { BACKEND_API_URL, getRequest, postRequest } from "../../utils/utils";
import { AccessPoint, Connection } from "./types";

export async function getWiFiStatus() {
    const url = `${BACKEND_API_URL}/wifi/status`;
    const response = await getRequest(url);
    return (await response.json()) as Connection;
}

export async function getAccessPoints() {
    const url = `${BACKEND_API_URL}/wifi/access_points`;
    const response = await getRequest(url);
    return (await response.json()) as AccessPoint[];
}

export async function getConnections() {
    const url = `${BACKEND_API_URL}/wifi/connections`;
    const response = await getRequest(url);
    return (await response.json()) as Connection[];
}

export async function connectToNetwork(ssid: string, password?: string) {
    const url = `${BACKEND_API_URL}/wifi/connect`;
    const response = await postRequest(url, { ssid, password });
    return await response.json();
}

export async function disconnectFromNetwork() {
    const url = `${BACKEND_API_URL}/wifi/disconnect`;
    const response = await postRequest(url);
    return await response.json();
}
