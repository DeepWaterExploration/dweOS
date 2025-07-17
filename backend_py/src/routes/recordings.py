from fastapi import APIRouter, Depends, Request
from fastapi.responses import FileResponse
from typing import List
import os
from ..services import RecordingsService, RecordingInfo

recordings_router = APIRouter(tags=['recordings'])

@recordings_router.get('/recordings', summary='Get all recordings')
def get_recordings(request: Request) -> List[RecordingInfo]:
    recordings_service: RecordingsService = request.app.state.recordings_service

    return recordings_service.get_recordings()
@recordings_router.get('/recordings/{recording_path}', summary='Get a specific recording')
def get_recording(request: Request, recording_path: str) -> RecordingInfo:

    recordings_service: RecordingsService = request.app.state.recordings_service

    recording_info = recordings_service.get_recording(recording_path)
    if not recording_info:
        return {"error": "Recording not found"}
    
    headers = {}
    if request.query_params.get('download', 'false').lower() == 'true':
        headers['Content-Disposition'] = "attachment; filename=" + recording_info.name + "." + recording_info.format

    return FileResponse(recording_info.path, headers=headers)
@recordings_router.delete('/recordings/{recording_path}', summary='Delete a recording')
def delete_recording(request: Request, recording_path: str):
    recordings_service: RecordingsService = request.app.state.recordings_service

    response = recordings_service.delete_recording(recording_path)
    if response == False:
        return {"error": "Recording not found or could not be deleted"}

    return response
