import { FeatureSupport } from "./types";
import { getRequest } from "./utils";

export async function getFeatureSupport(): Promise<FeatureSupport> {
    const response = await getRequest("/features");
    return await response.json();
}