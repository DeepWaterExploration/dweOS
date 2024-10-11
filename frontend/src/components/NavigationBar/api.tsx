import { BACKEND_API_URL, getRequest } from "../../utils/utils";

export async function getStatus() {
    const url = `${BACKEND_API_URL}/wifi/status`;
    const response = await getRequest(url);
    return (await response.json()) as { status: string };
}
