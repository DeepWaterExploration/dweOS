import {
    Device,
    PortInfo,
    ReleaseList,
    StreamEndpoint,
    StreamFormat,
    encodeType,
    optionType,
} from "../types/types";

const hostAddress: string = window.location.hostname;
export const DEVICE_API_URL = `http://${hostAddress}:8080`;
export const DEVICE_API_WS = `ws://${hostAddress}:9002`;
export const SYSTEM_API_URL = `http://${hostAddress}:5050`;
export const UPDATER_API_URL = `http://${hostAddress}:5000`;

async function getRequest(
    url: string,
    url_search_params: URLSearchParams | undefined = undefined
): Promise<Response> {
    const config: RequestInit = {
        mode: "cors",
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    };
    if (url_search_params) {
        url = `${url}?${url_search_params}`;
    }
    return await fetch(url, config);
}

async function postRequest(url: string, body: object = {}): Promise<Response> {
    const config: RequestInit = {
        mode: "cors",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    };
    return await fetch(url, config);
}

export async function getDevices(): Promise<Device[]> {
    const url = `${DEVICE_API_URL}/devices`;
    const response = await getRequest(url);
    return await response.json();
}

export async function getLeaders(): Promise<Device[]> {
    const url = `${DEVICE_API_URL}/devices/leader_bus_infos`;
    const response = await getRequest(url);
    return await response.json();
}

export async function unconfigureStream(bus_info: string) {
    const url = `${DEVICE_API_URL}/devices/unconfigure_stream`;
    const response = await postRequest(url, { bus_info });
    return await response.json();
}

export async function setLeader(leader: string, follower: string) {
    const url = `${DEVICE_API_URL}/devices/set_leader`;
    const response = await postRequest(url, { leader, follower });
    return await response.json();
}

export async function getLogs() {
    const url = `${DEVICE_API_URL}/logs`;
    const response = await getRequest(url);
    return await response.json();
}

export async function removeLeader(follower: string) {
    const url = `${DEVICE_API_URL}/devices/remove_leader`;
    const response = await postRequest(url, { follower });
    return await response.json();
}

export async function configureStream(
    bus_info: string,
    stream_format: StreamFormat,
    encode_type: encodeType,
    endpoints: StreamEndpoint[]
) {
    const url = `${DEVICE_API_URL}/devices/configure_stream`;
    const response = await postRequest(url, {
        bus_info,
        stream_format,
        encode_type,
        endpoints,
    });
    return await response.json();
}

export async function setDeviceNickname(bus_info: string, nickname: string) {
    const url = `${DEVICE_API_URL}/devices/set_nickname`;
    const response = await postRequest(url, { bus_info, nickname });
    await response.json();
}

export async function addStreamEndpoint(
    index: number,
    endpoint: StreamEndpoint
): Promise<void> {
    const url = `${DEVICE_API_URL}/add_stream_endpoint`;
    const response = await postRequest(url, { index, endpoint });
    return await response.json();
}

export async function setUVCControl(
    bus_info: string,
    value: number,
    control_id: number
): Promise<void> {
    const url = `${DEVICE_API_URL}/devices/set_uvc_control`;
    const response = await postRequest(url, { bus_info, value, control_id });
    return await response.json();
}

export async function setExploreHDOption(
    bus_info: string,
    option: optionType,
    value: number
) {
    const url = `${DEVICE_API_URL}/devices/set_option`;
    const response = await postRequest(url, { bus_info, option, value });
    await response.json();
}

export async function restartStream(bus_info: string) {
    const url = `${DEVICE_API_URL}/devices/restart_stream`;
    const response = await postRequest(url, { bus_info });
    await response.json();
}

export async function resetSettings() {
    const url = `${DEVICE_API_URL}/reset_settings`;
    const response = await postRequest(url);
    await response.json();
}

export async function shutDownMachine() {
    const url = `${SYSTEM_API_URL}/shutDownMachine`;
    await postRequest(url);
}

export async function restartMachine() {
    const url = `${SYSTEM_API_URL}/restartMachine`;
    await postRequest(url);
}

export async function installUpdate(tag_name: string) {
    const url = `${UPDATER_API_URL}/install_update`;
    await postRequest(url, { tag_name });
}

export async function getReleases(): Promise<ReleaseList> {
    const url = `${UPDATER_API_URL}/releases`;
    const response = await getRequest(url);
    return await response.json();
}

export async function getNextPort(host: string): Promise<number> {
    const url = `${DEVICE_API_URL}/devices/get_next_port`;
    const response = await getRequest(
        url,
        new URLSearchParams({
            host,
        })
    );
    return ((await response.json()) as PortInfo).port;
}
