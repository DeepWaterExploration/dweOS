"""
recording.py

API endpoints for accessing video file library
Handles listing recording metadata, downloading / deleting / renaming recordings, and downloading all recordings as ZIP
"""

from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import FileResponse
from typing import List
from ..services import RecordingsService, RecordingInfo

recordings_router = APIRouter(tags=['recordings'])

@recordings_router.get('/recordings', summary='Get all recordings')
def get_recordings(request: Request) -> List[RecordingInfo]:
    recordings_service: RecordingsService = request.app.state.recordings_service

    return recordings_service.get_recordings()
@recordings_router.get('/recordings/{recording_path}', summary='Get a specific recording')
def get_recording(request: Request, recording_path: str):

    recordings_service: RecordingsService = request.app.state.recordings_service

    recording_info = recordings_service.get_recording(recording_path)
    if not recording_info:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    headers = {}
    if request.query_params.get('download', 'false').lower() == 'true':
        headers['Content-Disposition'] = "attachment; filename=" + recording_info.name + "." + recording_info.format

    return FileResponse(recording_info.path, headers=headers)
@recordings_router.delete('/recordings/{recording_path}', summary='Delete a recording')
def delete_recording(request: Request, recording_path: str):
    recordings_service: RecordingsService = request.app.state.recordings_service

    response = recordings_service.delete_recording(recording_path)
    if response == False:
        raise HTTPException(status_code=404, detail="Recording not found or could not be deleted")

    return response
@recordings_router.patch('/recordings/{old_name}/{new_name}', summary='Rename a recording')
def rename_recording(request: Request, old_name: str, new_name: str):
    recordings_service: RecordingsService = request.app.state.recordings_service

    response = recordings_service.rename_recording(old_name, new_name)
    if response == False:
        raise HTTPException(status_code=404, detail="Recording not found or could not be renamed")

    return response
@recordings_router.get('/recording/zip', summary='Download all recordings as a zip file')
def zip_recordings(request: Request):
    recordings_service: RecordingsService = request.app.state.recordings_service

    zip_file_path = recordings_service.zip_recordings()
    if not zip_file_path:
        raise HTTPException(status_code=404, detail="No recordings to zip")

    resp = FileResponse(zip_file_path, media_type='application/zip', filename='recordings.zip', headers={"Content-Disposition": "attachment; filename=recordings.zip"})
    return resp