"""
system.py

API endpoints for csystem power control
Handles rebooting / shutting down the system
"""

from fastapi import APIRouter, Request

from ..schemas import SimpleRequestStatusModel
from ..services.system import SystemManager

system_router = APIRouter(tags=["system"])


@system_router.post("/restart", summary="Restart the system")
def restart(request: Request) -> SimpleRequestStatusModel:
    system_manager: SystemManager = request.app.state.system_manager
    system_manager.restart_system()
    return SimpleRequestStatusModel(success=True)


@system_router.post("/shutdown", summary="Shutdown the system")
def shutdown(request: Request) -> SimpleRequestStatusModel:
    system_manager: SystemManager = request.app.state.system_manager
    system_manager.shutdown_system()
    return SimpleRequestStatusModel(success=True)
