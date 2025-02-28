import { getRequest, postRequest } from "../../utils/utils";
import { IPConfiguration, NetworkPriority } from "./types";

export async function getIPConfiguration() {
    const response = await getRequest("/wired/get_ip_configuration");
    return (await response.json()) as IPConfiguration;
}

export async function setIPConfiguration(ip_configuration: IPConfiguration) {
    const response = await postRequest(
        "/wired/set_ip_configuration",
        ip_configuration
    );
    return await response.json();
}

export async function setNetworkPriority(networkPriority: NetworkPriority) {
    const response = await postRequest("/wired/set_network_priority", {
        network_priority: networkPriority,
    });
    return await response.json();
}

export async function getNetworkPriority() {
    const response = await getRequest("/wired/get_network_priority");
    return (await response.json()) as { network_priority: NetworkPriority };
}
