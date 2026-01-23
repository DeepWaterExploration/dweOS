"""
camera.py

API endpoints for camera device management and streaming config
Handles listing connected devices, updating stream settings (resolution / fps), setting UVC controls, and dealing with Leader/Follower for stereo cameras
"""

from fastapi import APIRouter, Depends, Request
from ..services import DeviceManager, StreamInfoModel, DeviceNicknameModel, UVCControlModel, DeviceDescriptorModel
import logging

from typing import List, cast

from ..services.cameras.pydantic_schemas import StreamInfoModel, DeviceNicknameModel, UVCControlModel, DeviceModel, SimpleRequestStatusModel, SyncGroupModel
from ..services.cameras.exceptions import DeviceNotFoundException
from ..services.cameras.pydantic_schemas import DeviceType
from ..services.cameras.shd import SHDDevice
camera_router = APIRouter(tags=['cameras'])


@camera_router.get('/devices', summary='Get all devices')
def get_devices(request: Request) -> List[DeviceModel]:
    device_manager: DeviceManager = request.app.state.device_manager

    return device_manager.get_devices()

@camera_router.get('/devices/sync_groups', summary='Get a list of the synchronization groups')
def get_sync_groups(request: Request) -> List[str]:
    device_manager: DeviceManager = request.app.state.device_manager
    
    return device_manager.sync_groups


@camera_router.post('/devices/set_sync_group', summary='Add a camera to a sync group (will create a new one if it does not already exist)')
def set_sync_group(request: Request, sync_group: SyncGroupModel):
    device_manager: DeviceManager = request.app.state.device_manager

    device_manager.add_to_sync_group(sync_group.bus_info, sync_group.group)

    return {}

@camera_router.post('/devices/configure_stream', summary='Configure a stream')
async def configure_stream(request: Request, stream_info: StreamInfoModel):
    device_manager: DeviceManager = request.app.state.device_manager

    device_manager.configure_device_stream(stream_info)
    
    for device in device_manager.devices:
        if device.bus_info == stream_info.bus_info:
            if device.device_type != DeviceType.STELLARHD_FOLLOWER:
                return {}
            break
    for device in device_manager.devices:
        if device.device_type == DeviceType.STELLARHD_LEADER:
            stellarhd_device = cast(SHDDevice, device)
            if stream_info.bus_info in stellarhd_device.followers:
                stellarhd_device.start_stream()

    return {}

@camera_router.post('/devices/set_nickname', summary='Set a device nickname')
def set_nickname(request: Request, device_nickname: DeviceNicknameModel):
    device_manager: DeviceManager = request.app.state.device_manager

    device_manager.set_device_nickname(
        device_nickname.bus_info, device_nickname.nickname)

    return {}


@camera_router.post('/devices/set_uvc_control', summary='Set a UVC control')
def set_uvc_control(request: Request, uvc_control: UVCControlModel):
    device_manager: DeviceManager = request.app.state.device_manager

    device_manager.set_device_uvc_control(
        uvc_control.bus_info, uvc_control.control_id, uvc_control.value)

    return {}


@camera_router.post('/devices/restart_stream', summary='Restart a stream')
def restart_stream(request: Request, device_descriptor: DeviceDescriptorModel):
    device_manager: DeviceManager = request.app.state.device_manager

    # will raise DeviceNotFoundException which will be handled by server
    try:
        dev = device_manager._find_device_with_bus_info(
            device_descriptor.bus_info)
    except DeviceNotFoundException:
        return SimpleRequestStatusModel(success=False)
    dev.start_stream()
    return {}
