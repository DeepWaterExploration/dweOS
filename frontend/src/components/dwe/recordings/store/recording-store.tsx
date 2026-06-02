import { API_CLIENT } from "@/api";
import {
  fullName,
  getRecordingStreamUrl,
  RecordingInfo,
} from "@/components/dwe/recordings/utils/recording-utils";
import { toast } from "sonner";
import { proxy } from "valtio";

interface DiskStats {
  total: number;
  used: number;
  free: number;
}
interface RecordingsState {
  recordings: RecordingInfo[];
  diskStats: DiskStats | null;
  selectedNames: string[];
  loading: boolean;
  zipDownloading: boolean;

  // Modal Targets
  playTarget: RecordingInfo | null;
  renameTarget: RecordingInfo | null;
  deleteTargets: RecordingInfo[];

  // Form States
  renameValue: string;
  renameSubmitting: boolean;
  deleteConfirmText: string;
  deleteSubmitting: boolean;

  // Context Menu
  contextMenu: {
    isOpen: boolean;
    x: number;
    y: number;
    target: RecordingInfo | null;
  };
}

export const recordingsState = proxy<RecordingsState>({
  recordings: [],
  diskStats: null,
  selectedNames: [],
  loading: true,
  zipDownloading: false,
  playTarget: null,
  renameTarget: null,
  deleteTargets: [],
  renameValue: "",
  renameSubmitting: false,
  deleteConfirmText: "",
  deleteSubmitting: false,
  contextMenu: { isOpen: false, x: 0, y: 0, target: null },
});

export const recordingsActions = {
  fetchDiskStats: async () => {
    try {
      const { data } = await API_CLIENT.GET("/api/recordings/disk");
      if (data) recordingsState.diskStats = data as DiskStats;
    } catch (error) {
      console.error("Error fetching disk stats:", error);
    }
  },

  fetchRecordings: async () => {
    recordingsState.loading = true;
    try {
      recordingsActions.fetchDiskStats();

      const { data } = await API_CLIENT.GET("/api/recordings");
      if (data) recordingsState.recordings = data;
    } catch (error) {
      console.error("Error fetching recordings:", error);
    } finally {
      recordingsState.loading = false;
    }
  },

  setSelectedNames: (names: string[]) => {
    recordingsState.selectedNames = names;
  },

  downloadRecording: (rec: RecordingInfo, baseUrl: string) => {
    const link = document.createElement("a");
    link.href = `${getRecordingStreamUrl(rec, baseUrl)}?download=true`;
    link.download = fullName(rec);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  downloadZip: async (baseUrl: string) => {
    if (recordingsState.zipDownloading) return;
    const selected = recordingsState.selectedNames;
    if (recordingsState.recordings.length === 0 || selected.length === 0)
      return;

    recordingsState.zipDownloading = true;
    try {
      const response = await fetch(`${baseUrl}/api/recordings/zip/prepare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected),
      });

      if (!response.ok) {
        let description = `Server responded with ${response.status}.`;
        try {
          const data = await response.json();
          if (data?.detail) description = data.detail;
        } catch {
          /* empty */
        }
        toast.error("Failed to download recordings", { description });
        return;
      }

      const { token } = await response.json();

      const filename =
        selected.length === recordingsState.recordings.length
          ? "all_recordings.zip"
          : "selected_recordings.zip";

      const downloadUrl = `${baseUrl}/api/recordings/zip/download?token=${token}&filename=${filename}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading zip:", error);
      toast.error("Failed to download recordings");
    } finally {
      recordingsState.zipDownloading = false;
    }
  },

  // Modal
  openPlay: (rec: RecordingInfo) => {
    recordingsState.playTarget = rec;
  },
  closePlay: () => {
    recordingsState.playTarget = null;
  },

  openRename: (rec: RecordingInfo) => {
    recordingsState.renameTarget = rec;
    recordingsState.renameValue = rec.name;
  },
  closeRename: () => {
    if (recordingsState.renameSubmitting) return;
    recordingsState.renameTarget = null;
  },
  setRenameValue: (val: string) => {
    recordingsState.renameValue = val;
  },

  openDelete: (targets: RecordingInfo[]) => {
    recordingsState.deleteTargets = targets;
    recordingsState.deleteConfirmText = "";
  },
  closeDelete: () => {
    if (recordingsState.deleteSubmitting) return;
    recordingsState.deleteTargets = [];
    recordingsState.deleteConfirmText = "";
  },
  setDeleteConfirmText: (val: string) => {
    recordingsState.deleteConfirmText = val;
  },

  // Perform actions
  performRename: async () => {
    const { renameTarget, renameValue } = recordingsState;
    if (!renameTarget) return;
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === renameTarget.name) {
      recordingsActions.closeRename();
      return;
    }

    recordingsState.renameSubmitting = true;
    try {
      const result = await API_CLIENT.PATCH(
        "/api/recordings/{old_name}/{new_name}",
        {
          params: {
            path: {
              old_name: fullName(renameTarget),
              new_name: `${trimmed}.${renameTarget.format}`,
            },
          },
        },
      );
      if (result.data) {
        recordingsState.recordings = result.data;
        toast.success("Recording renamed", {
          description: `"${renameTarget.name}" → "${trimmed}"`,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to rename recording");
    } finally {
      recordingsState.renameSubmitting = false;
      recordingsActions.closeRename();
    }
  },

  performDelete: async () => {
    const { deleteTargets } = recordingsState;
    if (!deleteTargets || deleteTargets.length === 0) return;

    recordingsState.deleteSubmitting = true;
    try {
      const targetNames = deleteTargets.map((t) => fullName(t));

      const result = await API_CLIENT.POST("/api/recordings/bulk-delete", {
        body: targetNames,
      });

      if (result.data) {
        recordingsState.recordings = result.data;
        recordingsActions.setSelectedNames([]);

        toast.success(
          deleteTargets.length > 1
            ? `Deleted ${deleteTargets.length} recordings`
            : `Recording deleted: ${deleteTargets[0].name}`,
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete recording");
    } finally {
      recordingsState.deleteSubmitting = false;
      recordingsActions.closeDelete();
    }
  },

  openContextMenu: (target: RecordingInfo, x: number, y: number) => {
    recordingsState.contextMenu = { isOpen: true, x, y, target };
  },
  closeContextMenu: () => {
    recordingsState.contextMenu.isOpen = false;
  },
};
