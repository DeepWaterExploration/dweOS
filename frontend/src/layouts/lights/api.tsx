import { LightDevice } from "./types";
import { getRequest, postRequest } from "../../utils/utils";

export async function getLights(): Promise<LightDevice[]> {
    const response = await getRequest("/lights");
    return await response.json();
}

export async function setIntensity(index: number, intensity: number) {
    const response = await postRequest("/lights/set_intensity", {
        index,
        intensity,
    });
    return await response.json();
}

export async function disablePin(index: number) {
    const response = await postRequest("/lights/disable_pin", { index });
    return await response.json();
}
