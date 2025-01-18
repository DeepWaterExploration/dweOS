from flask import Blueprint, request, jsonify, current_app
from ..services import DeviceManager, StreamInfoSchema, DeviceNicknameSchema, UVCControlSchema, DeviceType, DeviceLeaderSchema
import logging

cameras_bp = Blueprint('cameras', __name__, url_prefix='/api/devices')

@cameras_bp.route('/', methods=['GET'])
def get_devices():
    device_manager: DeviceManager = current_app.config['device_manager']

    return jsonify(device_manager.get_devices())

@cameras_bp.route('/configure_stream', methods=['POST'])
def configure_stream():
    device_manager: DeviceManager = current_app.config['device_manager']

    stream_info = StreamInfoSchema().load(request.get_json())

    device_manager.configure_device_stream(
    stream_info['bus_info'], stream_info)

    return jsonify({})

@cameras_bp.route('/unconfigure_stream', methods=['POST'])
def unconfigure_stream():
    device_manager: DeviceManager = current_app.config['device_manager']

    bus_info = StreamInfoSchema(only=['bus_info']).load(
    request.get_json())['bus_info']

    device_manager.uncofigure_device_stream(bus_info)

    return jsonify({})

@cameras_bp.route('/set_nickname', methods=['POST'])
def set_nickname():
    device_manager: DeviceManager = current_app.config['device_manager']
    
    device_nickname = DeviceNicknameSchema().load(request.get_json())

    device_manager.set_device_nickname(
    device_nickname['bus_info'], device_nickname['nickname'])

    return jsonify({})

@cameras_bp.route('/set_uvc_control', methods=['POST'])
def set_uvc_control():
    device_manager: DeviceManager = current_app.config['device_manager']

    uvc_control = UVCControlSchema().load(request.get_json())

    device_manager.set_device_uvc_control(
    uvc_control['bus_info'], uvc_control['control_id'], uvc_control['value'])

    return jsonify({})

@cameras_bp.route('/set_leader', methods=['POST'])
def set_leader():
    device_manager: DeviceManager = current_app.config['device_manager']

    leader_schema = DeviceLeaderSchema().load(request.get_json())
    device_manager.set_leader(leader_schema['leader'], leader_schema['follower'])
    return jsonify({})

@cameras_bp.route('/remove_leader', methods=['POST'])
def remove_leader():
    device_manager: DeviceManager = current_app.config['device_manager']

    leader_schema = DeviceLeaderSchema().load(request.get_json())
    device_manager.remove_leader(leader_schema['follower'])
    return jsonify({})

@cameras_bp.route('/restart_stream', methods=['POST'])
def restart_stream():
    device_manager: DeviceManager = current_app.config['device_manager']

    bus_info = StreamInfoSchema(only=['bus_info']).load(request.get_json())['bus_info']
    # will raise DeviceNotFoundException which will be handled by server
    dev = device_manager._find_device_with_bus_info(bus_info)
    dev.start_stream()
    return jsonify({})
