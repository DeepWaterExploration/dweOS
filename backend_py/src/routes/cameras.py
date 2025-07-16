from fastapi import APIRouter, Depends, Request
from ..services import DeviceManager, StreamInfoModel, DeviceNicknameModel, UVCControlModel, DeviceDescriptorModel, DeviceLeaderModel
import logging

from typing import List, cast

from ..services.cameras.pydantic_schemas import StreamInfoModel, DeviceNicknameModel, UVCControlModel, DeviceLeaderModel, DeviceModel, AddFollowerPayload, SimpleRequestStatusModel
from ..services.cameras.exceptions import DeviceNotFoundException
from ..services.cameras.pydantic_schemas import DeviceType
from ..services.cameras.shd import SHDDevice
camera_router = APIRouter(tags=['cameras'])

logger = logging.getLogger(__name__)

@camera_router.get('/devices', summary='Get all devices')
def get_devices(request: Request) -> List[DeviceModel]:
    device_manager: DeviceManager = request.app.state.device_manager

    return device_manager.get_devices()


@camera_router.post('/devices/configure_stream', summary='Configure a stream')
async def configure_stream(request: Request, stream_info: StreamInfoModel):
    device_manager: DeviceManager = request.app.state.device_manager

    device_manager.configure_device_stream(stream_info)
    
    # Check if this is a follower or leader device and sync accordingly
    for device in device_manager.devices:
        if device.bus_info == stream_info.bus_info:
            
            # If this is a leader device, we need to configure all its followers with the same settings
            if device.device_type == DeviceType.STELLARHD_LEADER and isinstance(device, SHDDevice):
                stellarhd_device = cast(SHDDevice, device)
                for follower_bus_info in stellarhd_device.followers:
                    # Find the follower device
                    for follower_device in device_manager.devices:

                        if follower_device.bus_info == follower_bus_info:
                            # Configure the follower with the same stream settings as the leader
                            follower_stream_info = StreamInfoModel.model_validate(stream_info)
                            follower_stream_info.bus_info = follower_bus_info
                            follower_stream_info.endpoints = follower_device.stream.endpoints
                            follower_stream_info.enabled = False
                            device_manager.configure_device_stream(follower_stream_info)
                            break
            break
        

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


@camera_router.post('/devices/add_follower', summary='Add a device as a follower to another device')
def add_follower(request: Request, payload: AddFollowerPayload) -> SimpleRequestStatusModel:
    device_manager: DeviceManager = request.app.state.device_manager

    success = device_manager.add_follower(
        payload.leader_bus_info, payload.follower_bus_info)

    return SimpleRequestStatusModel(success=success)


@camera_router.post('/devices/remove_follower', summary='Add a device as a follower to another device')
def remove_follower(request: Request, payload: AddFollowerPayload) -> SimpleRequestStatusModel:
    device_manager: DeviceManager = request.app.state.device_manager

    success = device_manager.remove_follower(
        payload.leader_bus_info, payload.follower_bus_info)

    return SimpleRequestStatusModel(success=success)


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
