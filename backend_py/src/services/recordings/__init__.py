from functools import lru_cache
import os
import subprocess
import threading
import zipfile
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

        threading.Thread(target=self.get_recordings, daemon=True).start()
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
                    duration=self._get_duration(file_stat.st_size),
                    size=f"{file_stat.st_size / (1024 * 1024):.2f} MB"
                )
                self.recordings.append(recording_info)

        return self.recordings
    
    @lru_cache(maxsize=10000)
    def _get_duration(self, size: int) -> str:
        # Estimate duration based on file size and a rough average bitrate
        average_bitrate = 5 * 1024 * 1024  # 5 MB
        # Convert size to seconds
        duration_seconds = size / average_bitrate
        if duration_seconds < 60:
            return f"00:00:{int(duration_seconds):02d}"
        elif duration_seconds < 3600:
            minutes = int(duration_seconds // 60)
            seconds = int(duration_seconds % 60)
            return f"00:{minutes:02d}:{seconds:02d}"
        else:
            hours = int(duration_seconds // 3600)
            minutes = int((duration_seconds % 3600) // 60)
            seconds = int(duration_seconds % 60)
            return f"{hours}:{minutes:02d}:{seconds:02d}"
        
    def get_recording(self, filename: str) -> RecordingInfo | None:
        self.get_recordings()
        recording_path = os.path.join(self.recordings_path, filename)
        for recording in self.recordings:
            if recording.path == recording_path:
                return recording
        return None
    
    def delete_recording(self, filename: str):
        recording_path = os.path.join(self.recordings_path, filename)
        if os.path.exists(recording_path):
            os.remove(recording_path)
            self.recordings = [rec for rec in self.recordings if rec.path != recording_path]
            return self.recordings
        return False
    

    def zip_recordings(self):
        self.get_recordings()  # Refresh the recordings list
        if not self.recordings:
            return None
            
        zip_filename = os.path.join(self.recordings_path, "recordings.zip")
        with zipfile.ZipFile(zip_filename, 'w') as zipf:
            for recording in self.recordings:
                zipf.write(recording.path, arcname=recording.name + '.' + recording.format)
        return zip_filename