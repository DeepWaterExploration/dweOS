import { BACKEND_API_URL, postRequest } from "../../utils/utils";

export async function restartMachine() {
    const url = `${BACKEND_API_URL}/system/restart`;
    const response = await postRequest(url);
    return await response.json();
}

export async function shutdownMachine() {
    const url = `${BACKEND_API_URL}/system/shutdown`;
    const response = await postRequest(url);
    return await response.json();
}
