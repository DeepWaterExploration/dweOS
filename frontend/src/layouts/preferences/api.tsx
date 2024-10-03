import { BACKEND_API_URL, getRequest, postRequest } from "../../utils/utils";
import { SavedPreferences } from "./types";

export async function getSettings(): Promise<SavedPreferences> {
    const url = `${BACKEND_API_URL}/preferences`;
    const response = await getRequest(url);
    return await response.json();
}

export async function savePreferences(preferences: SavedPreferences) {
    const url = `${BACKEND_API_URL}/preferences/save_preferences`;
    const response = await postRequest(url, preferences);
    await response.json();
}
