from fastapi import APIRouter, Depends, Request
from ..services import DeviceManager, StreamInfoSchema, DeviceNicknameSchema, UVCControlSchema, DeviceDescriptorSchema, DeviceLeaderSchema
import logging

from typing import List

from ..services.cameras.pydantic_schemas import StreamInfoSchema, DeviceNicknameSchema, UVCControlSchema, DeviceLeaderSchema, DeviceSchema

camera_router = APIRouter(tags=['cameras'])

@camera_router.get('/devices', summary='Get all devices')
def get_devices(request: Request) -> List[DeviceSchema]:
    device_manager: DeviceManager = request.app.state.device_manager

    return device_manager.get_devices()

@camera_router.post('/devices/configure_stream', summary='Configure a stream')
async def configure_stream(request: Request, stream_info: StreamInfoSchema):
    device_manager: DeviceManager = request.app.state.device_manager

    device_manager.configure_device_stream(stream_info)

    return {}

@camera_router.post('/devices/unconfigure_stream', summary='Unconfigure a stream')
def unconfigure_stream(request: Request, device_descriptor: DeviceDescriptorSchema):
    device_manager: DeviceManager = request.app.state.device_manager

    bus_info = device_descriptor.bus_info

    device_manager.unconfigure_device_stream(bus_info)

    return {}

@camera_router.post('/devices/set_nickname', summary='Set a device nickname')
def set_nickname(request: Request, device_nickname: DeviceNicknameSchema):
    device_manager: DeviceManager = request.app.state.device_manager

    device_manager.set_device_nickname(
    device_nickname.bus_info, device_nickname.nickname)

    return {}

@camera_router.post('/devices/set_uvc_control', summary='Set a UVC control')
def set_uvc_control(request: Request, uvc_control: UVCControlSchema):
    device_manager: DeviceManager = request.app.state.device_manager

    device_manager.set_device_uvc_control(
    uvc_control.bus_info, uvc_control.control_id, uvc_control.value)

    return {}

@camera_router.post('/devices/set_leader', summary='Set a device as a leader')
def set_leader(request: Request, device_leader: DeviceLeaderSchema):
    device_manager: DeviceManager = request.app.state.device_manager

    device_manager.set_leader(device_leader.leader, device_leader.follower)
    return {}

@camera_router.post('/devices/remove_leader', summary='Remove a device as a leader')
def remove_leader(request: Request, device_leader: DeviceLeaderSchema):
    device_manager: DeviceManager = request.app.state.device_manager

    device_manager.remove_leader(device_leader.follower)
    return {}

@camera_router.post('/devices/restart_stream', summary='Restart a stream')
def restart_stream(request: Request, device_descriptor: DeviceDescriptorSchema):
    device_manager: DeviceManager = request.app.state.device_manager

    # will raise DeviceNotFoundException which will be handled by server
    dev = device_manager._find_device_with_bus_info(device_descriptor.bus_info)
    dev.start_stream()
    return {}
