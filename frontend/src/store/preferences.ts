import { API_CLIENT } from "@/api";
import { components } from "@/schemas/dwe_os_2";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const getSuggestedHost = async () => {
  const { data, error } = await API_CLIENT.GET(
    "/api/preferences/get_recommended_host",
  );

  if (data) return data.host ?? "";
  else if (error) return "";

  return "";
};

export interface PreferencesStore {
  preferences: components["schemas"]["SavedPreferencesModel"] | null;
  fetchPreferences: () => void;
}

export const usePreferencesStore = create<PreferencesStore>()(
  immer((set) => ({
    preferences: null,
    recommendedHost: null,
    fetchPreferences: async () => {
      const { data, error } = await API_CLIENT.GET("/api/preferences");

      if (data) {
        if (data.suggest_host && data.default_stream) {
          data.default_stream.host = await getSuggestedHost();
        }

        set(() => ({ preferences: data }));
      } else if (error) {
        console.error(error);
      }
    },
  })),
);
