from fastapi import APIRouter, Request
from ..services import SystemManager, DeviceManager

system_router = APIRouter(tags=["system"])


@system_router.post("/system/restart", summary="Restart the system")
def restart(request: Request):
    system_manager: SystemManager = request.app.state.system_manager
    system_manager.restart_system()
    return {}


@system_router.post("/system/set_manual_frequency", summary="Set Manual Frequency")
def set_manual_frequency(request: Request, manual_frequency: float):
    device_manager: DeviceManager = request.app.state.device_manager
    device_manager.pwm_controller.set_manual_frequency(manual_frequency)

    return {}


@system_router.get("/system/get_frequency", summary="Get Manual Frequency")
def set_manual_frequency(request: Request):
    device_manager: DeviceManager = request.app.state.device_manager

    frequency = device_manager.pwm_controller.current_config.frequency

    return {'frequency': frequency}


@system_router.post("/system/shutdown", summary="Shutdown the system")
def shutdown(request: Request):
    system_manager: SystemManager = request.app.state.system_manager
    system_manager.shutdown_system()
    return {}
