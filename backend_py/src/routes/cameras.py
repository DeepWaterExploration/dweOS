from fastapi import APIRouter, Depends, Request
from ..services import DeviceManager, StreamInfoSchema, DeviceNicknameSchema, UVCControlSchema, DeviceType, DeviceLeaderSchema
from pydantic import BaseModel
import logging

from typing import List

from ..services.cameras.pydantic_schemas import StreamInfoSchema, DeviceNicknameSchema, UVCControlSchema, DeviceLeaderSchema, DeviceSchema

camera_router = APIRouter()

@camera_router.get('/devices')
def get_devices(request: Request) -> List[DeviceSchema]:
    device_manager: DeviceManager = request.app.state.device_manager

    return device_manager.get_devices()

@camera_router.post('/devices/configure_stream')
async def configure_stream(request: Request, stream_info: StreamInfoSchema):
    device_manager: DeviceManager = request.app.state.device_manager

    device_manager.configure_device_stream(stream_info)

    return {}

@camera_router.post('/devices/unconfigure_stream')
def unconfigure_stream():
    device_manager: DeviceManager = current_app.config['device_manager']

    bus_info = StreamInfoSchema(only=['bus_info']).load(
    request.get_json())['bus_info']

    device_manager.uncofigure_device_stream(bus_info)

    return jsonify({})

@camera_router.post('/devices/set_nickname')
def set_nickname():
    device_manager: DeviceManager = current_app.config['device_manager']
    
    device_nickname = DeviceNicknameSchema().load(request.get_json())

    device_manager.set_device_nickname(
    device_nickname['bus_info'], device_nickname['nickname'])

    return jsonify({})

@camera_router.post('/devices/set_uvc_control')
def set_uvc_control():
    device_manager: DeviceManager = current_app.config['device_manager']

    uvc_control = UVCControlSchema().load(request.get_json())

    device_manager.set_device_uvc_control(
    uvc_control['bus_info'], uvc_control['control_id'], uvc_control['value'])

    return jsonify({})

@camera_router.post('/devices/set_leader')
def set_leader():
    device_manager: DeviceManager = current_app.config['device_manager']

    leader_schema = DeviceLeaderSchema().load(request.get_json())
    device_manager.set_leader(leader_schema['leader'], leader_schema['follower'])
    return jsonify({})

@camera_router.post('/devices/remove_leader')
def remove_leader():
    device_manager: DeviceManager = current_app.config['device_manager']

    leader_schema = DeviceLeaderSchema().load(request.get_json())
    device_manager.remove_leader(leader_schema['follower'])
    return jsonify({})

@camera_router.post('/devices/restart_stream')
def restart_stream():
    device_manager: DeviceManager = current_app.config['device_manager']

    bus_info = StreamInfoSchema(only=['bus_info']).load(request.get_json())['bus_info']
    # will raise DeviceNotFoundException which will be handled by server
    dev = device_manager._find_device_with_bus_info(bus_info)
    dev.start_stream()
    return jsonify({})
