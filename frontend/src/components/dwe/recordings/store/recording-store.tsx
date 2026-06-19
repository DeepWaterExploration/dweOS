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

interface ZipJob {
  id: string;
  progress: number;
  status: "zipping" | "ready" | "error";
  totalFiles: number;
}
interface RecordingsState {
  recordings: RecordingInfo[];
  diskStats: DiskStats | null;
  selectedNames: string[];
  loading: boolean;
  hasFetched: boolean;
  zipJobs: ZipJob[];
  isZipDrawerMinimized: boolean;
  isCancelAllZipModalOpen: boolean;

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
  hasFetched: false,
  zipJobs: [],
  isZipDrawerMinimized: false,
  isCancelAllZipModalOpen: false,
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
      recordingsState.hasFetched = true;
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
    const selected = [...recordingsState.selectedNames];
    if (recordingsState.recordings.length === 0 || selected.length === 0)
      return;

    recordingsActions.setSelectedNames([]);
    recordingsState.isZipDrawerMinimized = false;

    try {
      const response = await fetch(`${baseUrl}/api/recordings/zip/prepare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected),
      });

      const { job_id } = await response.json();
      recordingsState.zipJobs.push({
        id: job_id,
        progress: 0,
        status: "zipping",
        totalFiles: selected.length,
      });

      // poll every 0.5 seconds for progress
      const pollInterval = setInterval(async () => {
        const jobIndex = recordingsState.zipJobs.findIndex(
          (j) => j.id === job_id,
        );

        if (jobIndex === -1) {
          clearInterval(pollInterval);
          return;
        }

        const statusRes = await fetch(
          `${baseUrl}/api/recordings/zip/status/${job_id}`,
        );
        if (!statusRes.ok) {
          clearInterval(pollInterval);
          recordingsState.zipJobs.splice(jobIndex, 1);
          return;
        }

        const { status, progress } = await statusRes.json();
        recordingsState.zipJobs[jobIndex].progress = progress || 0;

        if (status === "ready") {
          clearInterval(pollInterval);
          recordingsState.zipJobs[jobIndex].status = "ready";
          recordingsState.zipJobs[jobIndex].progress = 100;

          const downloadUrl = `${baseUrl}/api/recordings/zip/download?token=${job_id}&filename=selected_recordings.zip`;
          const link = document.createElement("a");
          link.href = downloadUrl;
          document.body.appendChild(link);
          link.click();
          link.remove();

          setTimeout(() => {
            const idx = recordingsState.zipJobs.findIndex(
              (j) => j.id === job_id,
            );
            if (idx !== -1) recordingsState.zipJobs.splice(idx, 1);
          }, 800);
        } else if (status === "error") {
          clearInterval(pollInterval);
          recordingsState.zipJobs.splice(jobIndex, 1);
          toast.error("Zipping failed on server.");
        }
      }, 500);
    } catch {
      toast.error("Failed to start download");
    }
  },

  cancelZip: async (baseUrl: string, jobId: string) => {
    try {
      await fetch(`${baseUrl}/api/recordings/zip/cancel/${jobId}`, {
        method: "POST",
      });
      const idx = recordingsState.zipJobs.findIndex((j) => j.id === jobId);
      if (idx !== -1) recordingsState.zipJobs.splice(idx, 1);
    } catch (error) {
      console.error("Error cancelling job:", error);
    }
  },

  cancelAllZips: async (baseUrl: string) => {
    const activeJobs = [...recordingsState.zipJobs];

    recordingsState.zipJobs = [];
    recordingsState.isZipDrawerMinimized = false;
    recordingsState.isCancelAllZipModalOpen = false;

    for (const job of activeJobs) {
      try {
        await fetch(`${baseUrl}/api/recordings/zip/cancel/${job.id}`, {
          method: "POST",
        });
      } catch (error) {
        console.error(`Error cancelling job ${job.id}:`, error);
      }
    }
  },

  toggleZipDrawer: () => {
    recordingsState.isZipDrawerMinimized =
      !recordingsState.isZipDrawerMinimized;
  },

  openCancelAllModal: () => {
    recordingsState.isCancelAllZipModalOpen = true;
  },
  closeCancelAllModal: () => {
    recordingsState.isCancelAllZipModalOpen = false;
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
