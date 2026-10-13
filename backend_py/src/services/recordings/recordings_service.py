"""
recordings

Handles locating recordings and extracting metadata from the files
Allows for the renaming, deletion, and compression of the found recordings
"""

import json
import logging
import os
import shutil
import subprocess
import threading
import uuid
import zipfile
from dataclasses import dataclass
from datetime import datetime

from backend_py.src.models import RecordingInfo


@dataclass
class Duration:
    duration_value: str
    size: int  # determine uniqueness


class RecordingsService:
    BASE_PATH = ""

    def __init__(self, data_dir: str) -> None:
        self.recordings_path = os.path.join(data_dir, "recordings")
        RecordingsService.BASE_PATH = self.recordings_path
        self.recordings: list[RecordingInfo] = []
        self.logger = logging.getLogger("dwe_os_2.RecordingsService")
        self.recordings_lock = threading.Lock()

        self.durations: dict[str, Duration] = {}
        self.active_recordings: dict[str, str] = {}

        self._last_dir_mtime = 0.0

        if not os.path.exists(self.recordings_path):
            os.makedirs(self.recordings_path)

    def get_disk_stats(self) -> shutil._ntuple_diskusage:
        return shutil.disk_usage(self.recordings_path)

    def get_recordings(self) -> list[RecordingInfo]:
        with self.recordings_lock:
            #  check last modified
            current_mtime = os.stat(self.recordings_path).st_mtime

            # if no files were added or removed, just return cache
            if self.recordings and current_mtime == self._last_dir_mtime:
                # A file being written to does not modify the directory, so the
                # size of an active recording has to be refreshed separately
                for recording in self.recordings:
                    try:
                        size_bytes = os.stat(recording.path).st_size
                    except FileNotFoundError:
                        continue

                    new_size = self._format_size(size_bytes)
                    if new_size != recording.size and not recording.path.endswith(
                        ".dwvo"
                    ):
                        duration = self._get_duration(recording.path)

                        if duration == "Unknown":
                            # Make the assumption this means that it's active
                            if recording.path not in self.active_recordings:
                                self.active_recordings[recording.path] = (
                                    recording.created
                                )

                            duration = self._elapsed_since(
                                self.active_recordings[recording.path]
                            )

                            recording.created = datetime.now().strftime(
                                "%Y-%m-%d %H:%M:%S"
                            )
                        else:
                            if recording.path in self.active_recordings:
                                self.active_recordings.pop(recording.path)

                        recording.duration = duration

                    recording.size = new_size

                return self.recordings

            # otherwise run scan
            recordings: list[RecordingInfo] = []
            for filename in os.listdir(self.recordings_path):
                if filename.endswith((".mp4", ".avi", ".dwvo")):
                    file_path = os.path.join(self.recordings_path, filename)
                    file_stat = os.stat(file_path)
                    recording_info = RecordingInfo(
                        path=file_path,
                        # Bus IDs in filenames can contain dots, so split on the last
                        name=os.path.splitext(filename)[0],
                        format=os.path.splitext(filename)[1][1:],
                        duration=(
                            self._get_duration(file_path)
                            if not filename.endswith(".dwvo")
                            else "00:00:00"
                        ),
                        created=self._epoch_to_readable(file_stat.st_ctime),
                        size=self._format_size(file_stat.st_size),
                    )
                    recordings.append(recording_info)

            self.recordings = recordings
            self._last_dir_mtime = current_mtime
            return recordings

    def _elapsed_since(self, created: str) -> str:
        start = datetime.strptime(created, "%Y-%m-%d %H:%M:%S")
        secs = max(int((datetime.now() - start).total_seconds()), 0)
        return f"{secs // 3600:02}:{secs % 3600 // 60:02}:{secs % 60:02}"

    def _format_size(self, size_bytes: int) -> str:
        return f"{size_bytes / (1024 * 1024):.2f} MB"

    def _epoch_to_readable(self, epoch: float) -> str:
        from datetime import datetime

        return datetime.fromtimestamp(epoch).strftime("%Y-%m-%d %H:%M:%S")

    def _get_duration(self, file_path: str) -> str:
        if file_path in self.durations:
            # Only cache if the size is the same, otherwise it was modified
            size = os.path.getsize(file_path)
            if size == self.durations[file_path].size:
                return self.durations[file_path].duration_value

        # FIXME: We need to change this function to use a better metadata library
        try:
            result = subprocess.run(
                ["exiftool", "-json", file_path],
                capture_output=True,
                text=True,
                check=True,
            )
            output = result.stdout.strip()
            if output:
                data = json.loads(output)

                size = os.path.getsize(file_path)

                if file_path.endswith(".mp4"):
                    duration = data[0].get("Duration", None)
                    if not duration:
                        return "Unknown"
                    if "s" in duration:
                        duration = (
                            f"00:00:{round(float(duration.replace(' s', ''))):02}"
                        )
                    self.durations[file_path] = Duration(
                        duration_value=duration, size=size
                    )
                    return duration

                totalFrameCount = data[0].get("TotalFrameCount", 0)
                frameRate = data[0].get("FrameRate", 0)
                if frameRate > 0:
                    duration = totalFrameCount / frameRate
                    hours = int(duration // 3600)
                    minutes = int((duration % 3600) // 60)
                    seconds = int(duration % 60)
                    duration = f"{hours:02}:{minutes:02}:{seconds:02d}"
                    self.durations[file_path] = Duration(
                        duration_value=duration, size=size
                    )
                    return duration

            return "Unknown"
        except FileNotFoundError as e:
            self.logger.error(f"exiftool was not found: {e}")
        except json.JSONDecodeError as e:
            self.logger.error(f"Error decoding output from exiftool: {e}")
        except Exception:
            # self.logger.error(f"exiftool had an unknown system error: {e}")
            pass
        return "Unknown"

    def get_recording(self, filename: str) -> RecordingInfo | None:
        self.get_recordings()
        recording_path = os.path.join(self.recordings_path, filename)
        for recording in self.recordings:
            if recording.path == recording_path:
                return recording
        return None

    def _remove_recording_file(self, filename: str) -> bool:
        # Caller must hold recordings_lock
        recording_path = os.path.join(self.recordings_path, filename)
        self.durations.pop(recording_path, None)

        if not os.path.exists(recording_path):
            return False

        os.remove(recording_path)
        self.recordings = [rec for rec in self.recordings if rec.path != recording_path]
        return True

    def delete_recording(self, filename: str) -> list[RecordingInfo] | None:
        with self.recordings_lock:
            if not self._remove_recording_file(filename):
                return None

        return self.get_recordings()

    def bulk_delete_recordings(self, filenames: list[str]) -> list[RecordingInfo]:
        with self.recordings_lock:
            for filename in filenames:
                self._remove_recording_file(filename)

        return self.get_recordings()

    def rename_recording(
        self, old_name: str, new_name: str
    ) -> list[RecordingInfo] | None:
        old_path = os.path.join(self.recordings_path, old_name)
        new_path = os.path.join(self.recordings_path, new_name)

        if os.path.exists(old_path):
            os.rename(old_path, new_path)
            for recording in self.recordings:
                if recording.path == old_path:
                    recording.name = os.path.splitext(new_name)[0]
                    recording.path = new_path
                    recording.format = os.path.splitext(new_name)[1][1:]
            return self.recordings
        return None

    def zip_recordings(
        self,
        filenames: list[str] | None = None,
        active_jobs: dict | None = None,
        job_id: str | None = None,
    ) -> str | None:
        self.get_recordings()
        if not self.recordings:
            return None

        targets = []
        for recording in self.recordings:
            full_name = f"{recording.name}.{recording.format}"
            if (
                filenames is not None
                and recording.name not in filenames
                and full_name not in filenames
            ):
                continue
            targets.append((recording, full_name))

        total_files = len(targets)
        if total_files == 0:
            return None

        unique_id = uuid.uuid4().hex
        zip_filename = os.path.join(self.recordings_path, f"temp_{unique_id}.zip")

        with zipfile.ZipFile(zip_filename, "w") as zipf:
            for i, (recording, full_name) in enumerate(targets):
                if active_jobs is not None and job_id is not None:
                    if active_jobs.get(job_id, {}).get("cancel", False):
                        zipf.close()
                        if os.path.exists(zip_filename):
                            os.remove(zip_filename)
                        return "CANCELLED"

                    progress = int((i / total_files) * 100)
                    active_jobs[job_id]["progress"] = progress

                zipf.write(recording.path, arcname=full_name)
        return zip_filename
