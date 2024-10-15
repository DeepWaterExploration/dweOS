import { getRequest } from "../../utils/utils";
import { Log } from "./types";

export async function getLogs(): Promise<Log[]> {
    const response = await getRequest("/logs");
    return await response.json();
}
