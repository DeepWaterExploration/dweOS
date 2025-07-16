from fastapi import APIRouter, Depends, Request
from typing import List
from fastapi.staticfiles import StaticFiles
from ..services import RecordingsService, RecordingInfo

recordings_router = APIRouter(tags=['recordings'])

@recordings_router.get('/recordings', summary='Get all recordings')
def get_recordings(request: Request) -> List[RecordingInfo]:
    recordings_service: RecordingsService = request.app.state.recordings_service

    return recordings_service.get_recordings()

@recordings_router.delete('/recordings/{recording_path}', summary='Delete a recording')
def delete_recording(request: Request, recording_path: str):
    recordings_service: RecordingsService = request.app.state.recordings_service

    success = recordings_service.delete_recording(recording_path)
    if not success:
        return {"error": "Recording not found or could not be deleted"}

    return {"message": "Recording deleted successfully"}


recordings_router.mount(
    "/recordings",
    StaticFiles(directory="videos"),
    name="recordings"
)