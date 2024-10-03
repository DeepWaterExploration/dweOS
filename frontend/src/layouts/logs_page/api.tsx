import { BACKEND_API_URL, getRequest } from "../../utils/utils";
import { Log } from "./types";

export async function getLogs(): Promise<Log[]> {
    const url = `${BACKEND_API_URL}/logs`;
    const response = await getRequest(url);
    return await response.json();
}
