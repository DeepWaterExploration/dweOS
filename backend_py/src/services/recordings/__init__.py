import os
import subprocess

from pydantic import BaseModel

class RecordingInfo(BaseModel):
    path: str
    name: str
    format: str
    duration: str
    size: str

class RecordingsService:
    def __init__(self):

        self.recordings_path = os.path.join(os.getcwd(), "videos")
        self.recordings: list[RecordingInfo] = []

    def get_recordings(self):
        if not os.path.exists(self.recordings_path):
            os.makedirs(self.recordings_path)

        self.recordings = []
        for filename in os.listdir(self.recordings_path):
            if filename.endswith(('.mp4', '.avi')):
                file_path = os.path.join(self.recordings_path, filename)
                file_stat = os.stat(file_path)
                recording_info = RecordingInfo(
                    path=file_path,
                    name=filename.split('.')[0],
                    format=filename.split('.')[-1],
                    duration=self._get_duration(file_path),
                    size=f"{file_stat.st_size / (1024 * 1024):.2f} MB"
                )
                self.recordings.append(recording_info)

        return self.recordings
    

    def _get_duration(self, file_path: str) -> str:
        command = ["gst-discoverer-1.0", file_path]
        try:
            result = subprocess.run(command, capture_output=True, text=True)
            if result.returncode == 0:
                # Parse the output to extract duration
                for line in result.stdout.splitlines():
                    if "Duration" in line:
                        return line.split(":", 1)[-1].strip()
        except Exception as e:
            print(f"Error getting duration: {e}")
        # If we can't get the duration, return a placeholder
        return "Unknown"

    def delete_recording(self, recording_path: str):
        if os.path.exists(recording_path):
            os.remove(recording_path)
            self.recordings = [rec for rec in self.recordings if rec.path != recording_path]
            return True
        return False
    
