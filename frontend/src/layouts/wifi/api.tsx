import { getRequest, postRequest } from "../../utils/utils";
import { AccessPoint, Connection, IPConfiguration, Status } from "./types";

export async function getWiFiStatus() {
    const response = await getRequest("/wifi/status");
    return (await response.json()) as Status;
}

export async function getAccessPoints() {
    const response = await getRequest("/wifi/access_points");
    return (await response.json()) as AccessPoint[];
}

export async function getConnections() {
    const response = await getRequest("/wifi/connections");
    return (await response.json()) as Connection[];
}

export async function connectToNetwork(ssid: string, password?: string) {
    const response = await postRequest("/wifi/connect", { ssid, password });
    return await response.json();
}

export async function disconnectFromNetwork() {
    const response = await postRequest("/wifi/disconnect");
    return await response.json();
}

export async function forgetNetwork(ssid: string) {
    const response = await postRequest("/wifi/forget", { ssid });
    return await response.json();
}

export async function getIPConfiguration() {
    const response = await getRequest("/wifi/get_ip_configuration");
    return (await response.json()) as IPConfiguration;
}

export async function setIPConfiguration(ip_configuration: IPConfiguration) {
    const response = await postRequest(
        "/wifi/set_ip_configuration",
        ip_configuration
    );
    return await response.json();
}
