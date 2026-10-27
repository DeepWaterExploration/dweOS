"""
updater.py

API endpoints for updating dweOS
Handles listing the available releases and installing one
"""

import asyncio
import subprocess
import urllib.error

from fastapi import APIRouter, HTTPException, Request

from ..models import InstallReleasePayload, ReleaseModel, UpdateStatusModel
from ..schemas import SimpleRequestStatusModel
from ..services.updater import UpdateInProgressError, UpdateManager

updater_router = APIRouter(tags=["updater"])


@updater_router.get("/releases", summary="List the releases available to install")
async def get_releases(request: Request) -> list[ReleaseModel]:
    update_manager: UpdateManager = request.app.state.update_manager
    try:
        return await asyncio.to_thread(update_manager.get_releases)
    except (urllib.error.URLError, TimeoutError) as e:
        raise HTTPException(
            status_code=502, detail=f"Failed to fetch releases from GitHub: {e}"
        ) from e


@updater_router.get("/status", summary="Get the status of the current update")
def get_status(request: Request) -> UpdateStatusModel:
    update_manager: UpdateManager = request.app.state.update_manager
    return update_manager.get_status()


@updater_router.post("/install", summary="Install a release")
def install_release(
    request: Request, payload: InstallReleasePayload
) -> SimpleRequestStatusModel:
    update_manager: UpdateManager = request.app.state.update_manager
    try:
        update_manager.start_update(payload.tag)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except UpdateInProgressError as e:
        raise HTTPException(status_code=409, detail=str(e)) from e
    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to start the update: {e.stderr}"
        ) from e
    return SimpleRequestStatusModel(success=True)
