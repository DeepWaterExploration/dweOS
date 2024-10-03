import { BACKEND_API_URL, getRequest, postRequest } from "../../utils/utils";
import { SavedPreferences } from "../preferences/types";
import {
    Device,
    encodeType,
    optionType,
    StreamEndpoint,
    StreamFormat,
} from "./types";

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

export async function restartStream(bus_info: string) {
    const url = `${BACKEND_API_URL}/devices/restart_stream`;
    const response = await postRequest(url, { bus_info });
    await response.json();
}
