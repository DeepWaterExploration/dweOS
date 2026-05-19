"""
recording.py

API endpoints for accessing video file library
Handles listing recording metadata, downloading / deleting / renaming recordings,
and downloading all recordings as ZIP
"""

import os
import time
import uuid

from fastapi import APIRouter, BackgroundTasks, Body, HTTPException, Request
from fastapi.responses import FileResponse

from backend_py.src.models import RecordingInfo

from ..services.recordings import RecordingsService

recordings_router = APIRouter(tags=["recordings"])

# dict of timp file paths
download_tokens: dict[str, dict] = {}


# Helpers
def remove_file(path: str) -> None:
    if os.path.exists(path):
        os.remove(path)


def clean_orphaned_tokens() -> None:
    current_time = time.time()
    expired_tokens = []

    for token, data in download_tokens.items():
        if current_time - data["created_at"] > 30:  # GET req not seen for 30 secs
            expired_tokens.append(token)

    for token in expired_tokens:
        data = download_tokens.pop(token)
        # in case local zip file wasn't deleted by background task
        remove_file(data["path"])


@recordings_router.get("", summary="Get all recordings")
def get_recordings(request: Request) -> list[RecordingInfo]:
    recordings_service: RecordingsService = request.app.state.recordings_service

    return recordings_service.get_recordings()


@recordings_router.post("/zip/prepare", summary="Zip files and generate token")
def prepare_zip_download(
    request: Request,
    filenames: list[str] = Body(...),  # noqa: B008
) -> dict:
    clean_orphaned_tokens()

    recordings_service: RecordingsService = request.app.state.recordings_service

    zip_file_path = recordings_service.zip_recordings(filenames)

    if not zip_file_path or not os.path.exists(zip_file_path):
        raise HTTPException(status_code=404, detail="No recordings to zip")

    token = uuid.uuid4().hex
    download_tokens[token] = {"path": zip_file_path, "created_at": time.time()}

    return {"token": token}


@recordings_router.get("/zip/download", summary="Download ZIP using token")
def download_zip(
    token: str,
    background_tasks: BackgroundTasks,
    filename: str = "selected_recordings.zip",
) -> FileResponse:
    if token not in download_tokens:
        raise HTTPException(status_code=404, detail="Invalid or expired download token")

    token_data = download_tokens.pop(token)
    zip_file_path = token_data["path"]

    if not os.path.exists(zip_file_path):
        raise HTTPException(status_code=404, detail="Zip file not found")

    background_tasks.add_task(remove_file, zip_file_path)

    return FileResponse(
        zip_file_path,
        media_type="application/zip",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@recordings_router.get("/{recording_path}", summary="Get a specific recording")
def get_recording(request: Request, recording_path: str) -> FileResponse:

    recordings_service: RecordingsService = request.app.state.recordings_service

    recording_info = recordings_service.get_recording(recording_path)
    if not recording_info:
        raise HTTPException(status_code=404, detail="Recording not found")

    headers = {}
    if request.query_params.get("download", "false").lower() == "true":
        headers["Content-Disposition"] = (
            "attachment; filename=" + recording_info.name + "." + recording_info.format
        )

    return FileResponse(recording_info.path, headers=headers)


@recordings_router.delete("/{recording_path}", summary="Delete a recording")
def delete_recording(request: Request, recording_path: str) -> list[RecordingInfo]:
    recordings_service: RecordingsService = request.app.state.recordings_service

    response = recordings_service.delete_recording(recording_path)
    if not response:
        raise HTTPException(
            status_code=404, detail="Recording not found or could not be deleted"
        )

    return response


@recordings_router.post("/bulk-delete", summary="Delete multiple recordings")
def bulk_delete_recording(
    request: Request,
    filenames: list[str] = Body(...),  # noqa: B008
) -> list[RecordingInfo]:
    recordings_service: RecordingsService = request.app.state.recordings_service

    response = recordings_service.bulk_delete_recordings(filenames)
    if not response:
        raise HTTPException(
            status_code=404, detail="Recordings not found or could not be deleted"
        )

    return response


@recordings_router.patch("/{old_name}/{new_name}", summary="Rename a recording")
def rename_recording(
    request: Request, old_name: str, new_name: str
) -> list[RecordingInfo]:
    recordings_service: RecordingsService = request.app.state.recordings_service

    response = recordings_service.rename_recording(old_name, new_name)
    if not response:
        raise HTTPException(
            status_code=404, detail="Recording not found or could not be renamed"
        )

    return response
