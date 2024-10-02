import { useRef, useEffect } from "react";

import { Device, Message } from "../types/types";

export const deserializeMessage = (message_str: string) => {
    let parts = message_str.split(": ");
    let message: Message = {
        event_name: parts[0],
        data: JSON.parse(message_str.substring(message_str.indexOf(": ") + 1)),
    };
    return message;
};

export const useDidMountEffect = (
    func: React.EffectCallback,
    deps?: React.DependencyList | undefined
) => {
    const didMount = useRef(false);

    useEffect(() => {
        if (didMount.current) func();
        else didMount.current = true;
    }, deps);
};

export const findDeviceWithBusInfo = (devices: Device[], bus_info: string) => {
    return devices.findIndex((device) => device.bus_info === bus_info);
};

export const IP_REGEX =
    /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;

// UTILITY FUNCTIONS

export async function getRequest(
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

export async function postRequest(
    url: string,
    body: object = {}
): Promise<Response> {
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

export const hostAddress: string = window.location.hostname;
export const BACKEND_API_URL = `http://${hostAddress}:8080`;
export const BACKEND_API_WS = `ws://${hostAddress}:9002`;
