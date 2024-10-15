import { getRequest, postRequest } from "../../utils/utils";
import { Device, encodeType, StreamEndpoint, StreamFormat } from "./types";

export async function getDevices(): Promise<Device[]> {
    const response = await getRequest("/devices");
    return await response.json();
}

export async function getLeaders(): Promise<Device[]> {
    const response = await getRequest("/devices/leader_bus_infos");
    return await response.json();
}

export async function unconfigureStream(bus_info: string) {
    const response = await postRequest("/devices/unconfigure_stream", {
        bus_info,
    });
    return await response.json();
}

export async function setLeader(leader: string, follower: string) {
    const response = await postRequest("/devices/set_leader", {
        leader,
        follower,
    });
    return await response.json();
}

export async function removeLeader(follower: string) {
    const response = await postRequest("/devices/remove_leader", { follower });
    return await response.json();
}

export async function configureStream(
    bus_info: string,
    stream_format: StreamFormat,
    encode_type: encodeType,
    endpoints: StreamEndpoint[]
) {
    const response = await postRequest("/devices/configure_stream", {
        bus_info,
        stream_format,
        encode_type,
        endpoints,
    });
    return await response.json();
}

export async function setDeviceNickname(bus_info: string, nickname: string) {
    const response = await postRequest("/devices/set_nickname", {
        bus_info,
        nickname,
    });
    await response.json();
}

export async function addStreamEndpoint(
    index: number,
    endpoint: StreamEndpoint
): Promise<void> {
    const response = await postRequest("/add_stream_endpoint", {
        index,
        endpoint,
    });
    return await response.json();
}

export async function setUVCControl(
    bus_info: string,
    value: number,
    control_id: number
): Promise<void> {
    const response = await postRequest("/devices/set_uvc_control", {
        bus_info,
        value,
        control_id,
    });
    return await response.json();
}

export async function restartStream(bus_info: string) {
    const response = await postRequest("/devices/restart_stream", { bus_info });
    await response.json();
}
