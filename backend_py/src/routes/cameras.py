"""
camera.py

API endpoints for camera device management and streaming config
Handles listing connected devices, updating stream settings (resolution / fps),
setting UVC controls, and dealing with Leader/Follower for stereo cameras
"""

from fastapi import APIRouter, Request

from backend_py.src.models import (
    AddFollowerPayload,
    DeviceDescriptorModel,
    DeviceModel,
    DeviceNicknameModel,
    StreamInfoModel,
    UVCControlModel,
)

from ..schemas import SimpleRequestStatusModel
from ..services.cameras import DeviceManager
from ..services.cameras.exceptions import DeviceNotFoundException

camera_router = APIRouter(tags=["cameras"])


@camera_router.get("", summary="Get all devices")
def get_devices(request: Request) -> list[DeviceModel]:
    device_manager: DeviceManager = request.app.state.device_manager

    return device_manager.get_devices()


@camera_router.post("/configure_stream", summary="Configure a stream")
def configure_stream(
    request: Request, stream_info: StreamInfoModel
) -> SimpleRequestStatusModel:
    device_manager: DeviceManager = request.app.state.device_manager

    device_manager.configure_device_stream(stream_info)

    return SimpleRequestStatusModel(success=True)


@camera_router.post("/set_nickname", summary="Set a device nickname")
def set_nickname(
    request: Request, device_nickname: DeviceNicknameModel
) -> SimpleRequestStatusModel:
    device_manager: DeviceManager = request.app.state.device_manager

    device_manager.set_device_nickname(
        device_nickname.bus_info, device_nickname.nickname
    )

    return SimpleRequestStatusModel(success=True)


@camera_router.post("/set_uvc_control", summary="Set a UVC control")
def set_uvc_control(
    request: Request, uvc_control: UVCControlModel
) -> SimpleRequestStatusModel:
    device_manager: DeviceManager = request.app.state.device_manager

    device_manager.set_device_uvc_control(
        uvc_control.bus_info, uvc_control.control_id, uvc_control.value
    )

    return SimpleRequestStatusModel(success=True)


@camera_router.post(
    "/add_follower", summary="Add a device as a follower to another device"
)
def add_follower(
    request: Request, payload: AddFollowerPayload
) -> SimpleRequestStatusModel:
    device_manager: DeviceManager = request.app.state.device_manager

    success = device_manager.add_follower(
        payload.leader_bus_info, payload.follower_bus_info
    )

    return SimpleRequestStatusModel(success=success)


@camera_router.post(
    "/remove_follower", summary="Add a device as a follower to another device"
)
def remove_follower(
    request: Request, payload: AddFollowerPayload
) -> SimpleRequestStatusModel:
    device_manager: DeviceManager = request.app.state.device_manager

    success = device_manager.remove_follower(
        payload.leader_bus_info, payload.follower_bus_info
    )

    return SimpleRequestStatusModel(success=success)


@camera_router.post("/restart_stream", summary="Restart a stream")
def restart_stream(
    request: Request, device_descriptor: DeviceDescriptorModel
) -> SimpleRequestStatusModel:
    device_manager: DeviceManager = request.app.state.device_manager

    # will raise DeviceNotFoundException which will be handled by server
    try:
        dev = device_manager._find_device_with_bus_info(device_descriptor.bus_info)
    except DeviceNotFoundException:
        return SimpleRequestStatusModel(success=False)
    dev.start_stream()
    return SimpleRequestStatusModel(success=True)
