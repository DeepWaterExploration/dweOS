import { LightDevice } from "./types";
import { BACKEND_API_URL, getRequest, postRequest } from "../../utils/utils";

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
