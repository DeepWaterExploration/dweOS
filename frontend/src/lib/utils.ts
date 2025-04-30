import { components } from "@/schemas/dwe_os_2";
import { clsx, type ClassValue } from "clsx";
import React, { useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getDeviceByBusInfo = (
  devices: components["schemas"]["DeviceModel"][],
  bus_info: string
) => {
  return devices.filter((dev) => dev.bus_info === bus_info)[0];
};

  // Function to get color for log level badge
export const getLevelColor = (level: string) => {
  switch (level) {
    case "DEBUG":
      return "bg-blue-500 hover:bg-blue-600";
    case "INFO":
      return "bg-gray-500 hover:bg-gray-600";
    case "WARNING":
      return "bg-yellow-500 hover:bg-yellow-600";
    case "ERROR":
      return "bg-red-500 hover:bg-red-600";
    case "CRITICAL":
      return "bg-purple-500 hover:bg-purple-600";
    default:
      return "bg-gray-500 hover:bg-gray-600";
  }
};

export function useDidMountEffect(
  effect: React.EffectCallback,
  deps: React.DependencyList
) {
  const didMount = useRef(false);

  useEffect(() => {
    if (didMount.current) {
      return effect();
    } else {
      didMount.current = true;
    }
  }, deps);
}
