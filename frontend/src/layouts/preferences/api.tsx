import { getRequest, postRequest } from "../../utils/utils";
import { SavedPreferences } from "./types";

export async function getSettings(): Promise<SavedPreferences> {
    const response = await getRequest("/preferences");
    return await response.json();
}

export async function getRecommendedHost(): Promise<string> {
    const response = await getRequest("/preferences/get_recommended_host");
    return ((await response.json()) as { host: string }).host;
}

export async function savePreferences(preferences: SavedPreferences) {
    const response = await postRequest(
        "/preferences/save_preferences",
        preferences
    );
    await response.json();
}
