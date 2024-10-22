import { StreamEndpoint } from "../cameras/types";

export interface SavedPreferences {
    default_stream: StreamEndpoint;
    suggest_host: boolean;
}
