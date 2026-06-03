"""
recordings

Handles locating recordings and extracting metadata from the files
Allows for the renaming, deletion, and compression of the found recordings
"""

import json
import logging
import os
import subprocess
import threading
import uuid
import zipfile

from backend_py.src.models import RecordingInfo


class RecordingsService:
    BASE_PATH = ""

    def __init__(self, data_dir: str) -> None:
        self.recordings_path = os.path.join(data_dir, "recordings")
        RecordingsService.BASE_PATH = self.recordings_path
        self.recordings: list[RecordingInfo] = []
        self.logger = logging.getLogger("dwe_os_2.RecordingsService")
        self.recordings_lock = threading.Lock()

        self.durations = {}

        self._last_dir_mtime = 0.0

        if not os.path.exists(self.recordings_path):
            os.makedirs(self.recordings_path)

    def get_recordings(self) -> list[RecordingInfo]:
        with self.recordings_lock:
            #  check last modified
            current_mtime = os.stat(self.recordings_path).st_mtime

            # if no modifications, just return cache
            if self.recordings and current_mtime == self._last_dir_mtime:
                return self.recordings

            # otherwise run scan
            recordings: list[RecordingInfo] = []
            for filename in os.listdir(self.recordings_path):
                if filename.endswith((".mp4", ".avi", ".dwvo")):
                    file_path = os.path.join(self.recordings_path, filename)
                    file_stat = os.stat(file_path)
                    recording_info = RecordingInfo(
                        path=file_path,
                        name=filename.split(".")[0],
                        format=filename.split(".")[-1],
                        duration=self._get_duration(file_path),
                        created=self._epoch_to_readable(file_stat.st_ctime),
                        size=f"{file_stat.st_size / (1024 * 1024):.2f} MB",
                    )
                    recordings.append(recording_info)

            self.recordings = recordings
            self._last_dir_mtime = current_mtime
            return recordings

    def _epoch_to_readable(self, epoch: float) -> str:
        from datetime import datetime

        return datetime.fromtimestamp(epoch).strftime("%Y-%m-%d %H:%M:%S")

    def _get_duration(self, file_path: str) -> str:
        if file_path in self.durations:
            self.logger.info(f"Found cached duration: {file_path}")
            return self.durations[file_path]

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

                if file_path.endswith(".mp4"):
                    duration = data[0].get("Duration", "00:00:00")
                    if "s" in duration:
                        duration = (
                            f"00:00:{round(float(duration.replace(' s', ''))):02}"
                        )
                    self.durations[file_path] = duration
                    return duration

                totalFrameCount = data[0].get("TotalFrameCount", 0)
                frameRate = data[0].get("FrameRate", 0)
                if frameRate > 0:
                    duration = totalFrameCount / frameRate
                    hours = int(duration // 3600)
                    minutes = int((duration % 3600) // 60)
                    seconds = int(duration % 60)
                    duration = f"{hours:02}:{minutes:02}:{seconds:02d}"
                    self.durations[file_path] = duration
                    return duration

            return "00:00:00"
        except FileNotFoundError as e:
            self.logger.error(f"exiftool was not found: {e}")
        except json.JSONDecodeError as e:
            self.logger.error(f"Error decoding output from exiftool: {e}")
        except Exception as e:
            self.logger.error(f"exiftool had an unknown system error: {e}")
        return "Unknown"

    def get_recording(self, filename: str) -> RecordingInfo | None:
        self.get_recordings()
        recording_path = os.path.join(self.recordings_path, filename)
        for recording in self.recordings:
            if recording.path == recording_path:
                return recording
        return None

    def delete_recording(self, filename: str) -> list[RecordingInfo] | None:
        if filename in self.durations:
            self.durations.pop(filename, None)

        recording_path = os.path.join(self.recordings_path, filename)
        if os.path.exists(recording_path):
            os.remove(recording_path)
            self.recordings = [
                rec for rec in self.recordings if rec.path != recording_path
            ]
            return self.recordings
        return None

    def bulk_delete_recordings(self, filenames: list[str]) -> list[RecordingInfo]:
        with self.recordings_lock:
            for filename in filenames:
                if filename in self.durations:
                    self.durations.pop(filename, None)

                recording_path = os.path.join(self.recordings_path, filename)
                if os.path.exists(recording_path):
                    os.remove(recording_path)

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
                    recording.name = new_name.split(".")[0]
                    recording.path = new_path
                    recording.format = new_name.split(".")[-1]
            return self.recordings
        return None

    def zip_recordings(self, filenames: list[str] | None = None, active_jobs: dict | None = None, job_id: str | None = None) -> str | None:
        self.get_recordings()
        if not self.recordings:
            return None

        targets = []
        for recording in self.recordings:
            full_name = f"{recording.name}.{recording.format}"
            if filenames is not None and recording.name not in filenames and full_name not in filenames:
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
