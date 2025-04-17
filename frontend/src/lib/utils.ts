import { components } from "@/schemas/dwe_os_2";
import { clsx, type ClassValue } from "clsx";
import React, { useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getRequest(
  path: string,
  url_search_params: URLSearchParams | undefined = undefined
): Promise<Response> {
  let url = `http://${window.location.hostname}:9090${path}`;
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
): Promise<void> {
  const url = `http://${window.location.hostname}:9090${path}`;
  const config: RequestInit = {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

export const boxMullerRandom = (function () {
  let phase = 0,
    RAND_MAX,
    array,
    random,
    x1,
    x2,
    w,
    z;

  if (crypto && typeof crypto.getRandomValues === "function") {
    RAND_MAX = Math.pow(2, 32) - 1;
    array = new Uint32Array(1);
    random = function () {
      crypto.getRandomValues(array);

      return array[0] / RAND_MAX;
    };
  } else {
    random = Math.random;
  }

  return function () {
    if (!phase) {
      do {
        x1 = 2.0 * random() - 1.0;
        x2 = 2.0 * random() - 1.0;
        w = x1 * x1 + x2 * x2;
      } while (w >= 1.0);

      w = Math.sqrt((-2.0 * Math.log(w)) / w);
      z = x1 * w;
    } else {
      z = x2 * w;
    }

    phase ^= 1;

    return z;
  };
})();

export const getDeviceByBusInfo = (
  devices: components["schemas"]["DeviceModel"][],
  bus_info: string
) => {
  return devices.filter((dev) => dev.bus_info === bus_info)[0];
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
