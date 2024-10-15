import { postRequest } from "../../utils/utils";

export async function restartMachine() {
    const response = await postRequest("/system/restart");
    return await response.json();
}

export async function shutdownMachine() {
    const response = await postRequest("/system/shutdown");
    return await response.json();
}
