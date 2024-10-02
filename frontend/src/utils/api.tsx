import {
    Device,
    LightDevice,
    Log,
    PWMController,
    PortInfo,
    ReleaseList,
    SavedPreferences,
    StreamEndpoint,
    StreamFormat,
    encodeType,
    optionType,
} from "../types/types";
import { BACKEND_API_URL, getRequest, postRequest } from "./utils";

// LIGHTS

export async function getLights(): Promise<LightDevice[]> {
    const url = `${BACKEND_API_URL}/lights`;
    const response = await getRequest(url);
    return await response.json();
}

export async function setIntensity(index: number, intensity: number) {
    const url = `${BACKEND_API_URL}/lights/set_intensity`;
    const response = await postRequest(url, { index, intensity });
    return await response.json();
}

export async function disablePin(index: number) {
    const url = `${BACKEND_API_URL}/lights/disable_pin`;
    const response = await postRequest(url, { index });
    return await response.json();
}

// CAMERAS

export async function getDevices(): Promise<Device[]> {
    const url = `${BACKEND_API_URL}/devices`;
    const response = await getRequest(url);
    return await response.json();
}

export async function getLeaders(): Promise<Device[]> {
    const url = `${BACKEND_API_URL}/devices/leader_bus_infos`;
    const response = await getRequest(url);
    return await response.json();
}

export async function unconfigureStream(bus_info: string) {
    const url = `${BACKEND_API_URL}/devices/unconfigure_stream`;
    const response = await postRequest(url, { bus_info });
    return await response.json();
}

export async function setLeader(leader: string, follower: string) {
    const url = `${BACKEND_API_URL}/devices/set_leader`;
    const response = await postRequest(url, { leader, follower });
    return await response.json();
}

export async function removeLeader(follower: string) {
    const url = `${BACKEND_API_URL}/devices/remove_leader`;
    const response = await postRequest(url, { follower });
    return await response.json();
}

export async function configureStream(
    bus_info: string,
    stream_format: StreamFormat,
    encode_type: encodeType,
    endpoints: StreamEndpoint[]
) {
    const url = `${BACKEND_API_URL}/devices/configure_stream`;
    const response = await postRequest(url, {
        bus_info,
        stream_format,
        encode_type,
        endpoints,
    });
    return await response.json();
}

export async function setDeviceNickname(bus_info: string, nickname: string) {
    const url = `${BACKEND_API_URL}/devices/set_nickname`;
    const response = await postRequest(url, { bus_info, nickname });
    await response.json();
}

export async function addStreamEndpoint(
    index: number,
    endpoint: StreamEndpoint
): Promise<void> {
    const url = `${BACKEND_API_URL}/add_stream_endpoint`;
    const response = await postRequest(url, { index, endpoint });
    return await response.json();
}

export async function setUVCControl(
    bus_info: string,
    value: number,
    control_id: number
): Promise<void> {
    const url = `${BACKEND_API_URL}/devices/set_uvc_control`;
    const response = await postRequest(url, { bus_info, value, control_id });
    return await response.json();
}

export async function setExploreHDOption(
    bus_info: string,
    option: optionType,
    value: number
) {
    const url = `${BACKEND_API_URL}/devices/set_option`;
    const response = await postRequest(url, { bus_info, option, value });
    await response.json();
}

export async function restartStream(bus_info: string) {
    const url = `${BACKEND_API_URL}/devices/restart_stream`;
    const response = await postRequest(url, { bus_info });
    await response.json();
}

export async function getSettings(): Promise<SavedPreferences> {
    const url = `${BACKEND_API_URL}/preferences`;
    const response = await getRequest(url);
    return await response.json();
}

export async function savePreferences(preferences: SavedPreferences) {
    const url = `${BACKEND_API_URL}/preferences/save_preferences`;
    const response = await postRequest(url, preferences);
    await response.json();
}

// LOGS

export async function getLogs(): Promise<Log[]> {
    const url = `${BACKEND_API_URL}/logs`;
    const response = await getRequest(url);
    return await response.json();
}
