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
