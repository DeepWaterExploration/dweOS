import {
    Device,
    PortInfo,
    ReleaseList,
    StreamEndpoint,
    StreamFormat,
    encodeType,
    optionType,
} from "../types/types";

export async function updateStream(
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
