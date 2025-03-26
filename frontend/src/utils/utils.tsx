import { useRef, useEffect, useContext } from "react";

import { Message } from "../types/types";
import { Device } from "../layouts/cameras/types";

export const deserializeMessage = (message_str: string) => {
    return JSON.parse(message_str) as Message;
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
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)+([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$/;

// UTILITY FUNCTIONS

export async function getRequest(
    path: string,
    url_search_params: URLSearchParams | undefined = undefined
): Promise<Response> {
    let url = `${BACKEND_API_URL()}${path}`;
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
    path: string,
    body: object = {}
): Promise<Response> {
    const url = `${BACKEND_API_URL()}${path}`;
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

export const hash = function (str: string) {
    let hash = 0,
        i,
        chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0;
    }
    return hash;
};

export const isValidIP = (ip: string) => {
    return (
        /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) &&
        ip.split(".").every((octet) => parseInt(octet) <= 255)
    );
};

export const hostAddress: string = window.location.hostname;
// export const hostAddress: string = "dweos.local"; // for dev purposes
export const BACKEND_API_URL = (hostname?: string) =>
    `http://${hostname || import.meta.env.DEV ? hostAddress + ":5000" : window.location.host}`;
export const TTYD_TOKEN_URL = (hostname?: string) =>
    `http://${hostname || window.location.hostname}:7681/token`;
export const TTYD_WS = (hostname?: string) =>
    `ws://${hostname || window.location.hostname}:7681/ws`;
