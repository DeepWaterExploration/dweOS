from fastapi import APIRouter, Request
from ..services import SystemManager
import logging

system_router = APIRouter(tags=['system'])

@system_router.post('/system/restart')
def restart(request: Request):
    system_manager: SystemManager = request.app.state.system_manager
    system_manager.restart_system()
    return {}

@system_router.post('/system/shutdown')
def shutdown(request: Request):
    system_manager: SystemManager = request.app.state.system_manager
    system_manager.shutdown_system()
    return {}
