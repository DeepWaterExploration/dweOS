"""
recording.py

API endpoints for accessing video file library
Handles listing recording metadata, downloading / deleting / renaming recordings,
and downloading all recordings as ZIP
"""

import asyncio
import os
import shutil
import time
import uuid

from fastapi import APIRouter, BackgroundTasks, Body, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel

from backend_py.src.models import RecordingInfo

from ..services.recordings import RecordingsService

recordings_router = APIRouter(tags=["recordings"])


class DiskStatsResponse(BaseModel):
    total: int
    used: int
    free: int


active_zip_jobs: dict[str, dict] = {}


# Helpers
def remove_file(path: str) -> None:
    if os.path.exists(path):
        os.remove(path)


# for refreshes during downloads
async def auto_cleanup_job(job_id: str) -> None:
    await asyncio.sleep(600)  # Wait 10 minutes
    if job_id in active_zip_jobs:
        data = active_zip_jobs.pop(job_id)
        if data.get("path"):
            remove_file(data["path"])


def background_zip_worker(
    job_id: str, filenames: list[str], service: RecordingsService
) -> None:
    try:
        zip_path = service.zip_recordings(
            filenames, active_jobs=active_zip_jobs, job_id=job_id
        )

        if zip_path == "CANCELLED":
            active_zip_jobs.pop(job_id, None)
            return

        if job_id in active_zip_jobs:
            active_zip_jobs[job_id]["status"] = "ready"
            active_zip_jobs[job_id]["path"] = zip_path

    except Exception:
        if job_id in active_zip_jobs:
            active_zip_jobs[job_id]["status"] = "error"


@recordings_router.get("", summary="Get all recordings")
def get_recordings(request: Request) -> list[RecordingInfo]:
    recordings_service: RecordingsService = request.app.state.recordings_service

    return recordings_service.get_recordings()


@recordings_router.get(
    "/disk", summary="Get physical disk usage", response_model=DiskStatsResponse
)
def get_disk_usage(request: Request) -> DiskStatsResponse:
    recordings_service: RecordingsService = request.app.state.recordings_service

    total, used, free = shutil.disk_usage(recordings_service.recordings_path)

    return DiskStatsResponse(total=total, used=used, free=free)


@recordings_router.post("/zip/prepare", summary="Start background zip job")
def start_zip_job(
    request: Request,
    background_tasks: BackgroundTasks,
    filenames: list[str] = Body(...),  # noqa: B008
) -> dict:
    job_id = uuid.uuid4().hex
    active_zip_jobs[job_id] = {
        "status": "zipping",
        "cancel": False,
        "path": None,
        "created_at": time.time(),
        "progress": 0,
    }
    recordings_service = request.app.state.recordings_service
    background_tasks.add_task(
        background_zip_worker, job_id, filenames, recordings_service
    )
    background_tasks.add_task(auto_cleanup_job, job_id)

    return {"job_id": job_id}


@recordings_router.get("/zip/status/{job_id}", summary="Check zip job status")
def check_zip_status(job_id: str) -> dict:
    if job_id not in active_zip_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    job = active_zip_jobs[job_id]
    return {"status": job["status"], "progress": job.get("progress", 0)}


@recordings_router.post("/zip/cancel/{job_id}", summary="Cancel a zip job")
def cancel_zip_job(job_id: str) -> dict:
    if job_id in active_zip_jobs:
        active_zip_jobs[job_id]["cancel"] = True
    return {"message": "Cancellation requested"}


@recordings_router.get("/zip/download", summary="Download ZIP using token")
def download_zip(
    token: str,
    background_tasks: BackgroundTasks,
    filename: str = "selected_recordings.zip",
) -> FileResponse:
    if token not in active_zip_jobs:
        raise HTTPException(status_code=404, detail="Invalid or expired download token")

    job_data = active_zip_jobs.pop(token)
    zip_file_path = job_data.get("path")

    if not zip_file_path or not os.path.exists(zip_file_path):
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
