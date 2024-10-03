from flask import Blueprint, request, jsonify, current_app
from ..services import DeviceManager, OptionValueSchema, StreamInfoSchema, DeviceNicknameSchema, UVCControlSchema, DeviceType, DeviceLeaderSchema
import logging

cameras_bp = Blueprint('cameras', __name__)

@cameras_bp.route('/devices', methods=['GET'])
def get_devices():
    device_manager: DeviceManager = current_app.config['device_manager']

    return jsonify(device_manager.get_devices())

@cameras_bp.route('/devices/set_option', methods=['POST'])
def set_option():
    device_manager: DeviceManager = current_app.config['device_manager']

    option_value = OptionValueSchema().load(request.get_json())

    device_manager.set_device_option(
    option_value['bus_info'], option_value['option'], option_value['value'])

    return jsonify({})

@cameras_bp.route('/devices/configure_stream', methods=['POST'])
def configure_stream():
    device_manager: DeviceManager = current_app.config['device_manager']

    stream_info = StreamInfoSchema().load(request.get_json())

    device_manager.configure_device_stream(
    stream_info['bus_info'], stream_info)

    return jsonify({})

@cameras_bp.route('/devices/unconfigure_stream', methods=['POST'])
def unconfigure_stream():
    device_manager: DeviceManager = current_app.config['device_manager']

    bus_info = StreamInfoSchema(only=['bus_info']).load(
    request.get_json())['bus_info']

    device_manager.uncofigure_device_stream(bus_info)

    return jsonify({})

@cameras_bp.route('/devices/set_nickname', methods=['POST'])
def set_nickname():
    device_manager: DeviceManager = current_app.config['device_manager']
    
    device_nickname = DeviceNicknameSchema().load(request.get_json())

    device_manager.set_device_nickname(
    device_nickname['bus_info'], device_nickname['nickname'])

    return jsonify({})

@cameras_bp.route('/devices/set_uvc_control', methods=['POST'])
def set_uvc_control():
    device_manager: DeviceManager = current_app.config['device_manager']

    uvc_control = UVCControlSchema().load(request.get_json())

    device_manager.set_device_uvc_control(
    uvc_control['bus_info'], uvc_control['control_id'], uvc_control['value'])

    return jsonify({})

@cameras_bp.route('/devices/leader_bus_infos')
def get_leader_bus_infos():
    device_manager: DeviceManager = current_app.config['device_manager']

    bus_infos = []
    for device in device_manager.devices:
        if device.device_type == DeviceType.STELLARHD_LEADER:
            bus_infos.cameras_bpend({
            'nickname': device.nickname,
            'bus_info': device.bus_info
            })

    return jsonify(bus_infos)

@cameras_bp.route('/devices/set_leader', methods=['POST'])
def set_leader():
    device_manager: DeviceManager = current_app.config['device_manager']

    leader_schema = DeviceLeaderSchema().load(request.get_json())
    device_manager.set_leader(leader_schema['leader'], leader_schema['follower'])
    return jsonify({})

@cameras_bp.route('/devices/remove_leader', methods=['POST'])
def remove_leader():
    device_manager: DeviceManager = current_app.config['device_manager']

    leader_schema = DeviceLeaderSchema().load(request.get_json())
    device_manager.remove_leader(leader_schema['follower'])
    return jsonify({})

@cameras_bp.route('/devices/restart_stream', methods=['POST'])
def restart_stream():
    device_manager: DeviceManager = current_app.config['device_manager']

    bus_info = StreamInfoSchema(only=['bus_info']).load(request.get_json())['bus_info']
    dev = device_manager._find_device_with_bus_info(bus_info)
    if not dev:
        logging.warning(f'Unable to find device {bus_info}')
        return jsonify({})
    
    dev.start_stream()
    return jsonify({})
