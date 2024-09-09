from ctypes import *
import sys
import signal

from flask import Flask, jsonify, request
from flask_cors import CORS
from gevent.pywsgi import WSGIServer

from .enumeration import *
from .camera_helper_loader import *
from .schemas import *
from .device import *
from .stream import *
from .settings import SettingsManager
from .broadcast_server import BroadcastServer
from .device_manager import DeviceManager
from .lights.light_manager import LightManager
from .lights.fake_pwm import FakePWMController
from .lights.schemas import LightSchema
from .lights.light import Light
from .lights.utils import is_raspberry_pi

from .devices.shd import SHDDevice

from typing import cast

import logging


def main():
    app = Flask(__name__)
    CORS(app)
    app.json.sort_keys = False

    settings_manager = SettingsManager()
    broadcast_server = BroadcastServer()
    device_manager = DeviceManager(
        settings_manager=settings_manager, broadcast_server=broadcast_server)
    
    pwm_controller = None
    if is_raspberry_pi():
        try:
            from .lights.rpi import RaspberryPiPWMController
            pwm_controller = RaspberryPiPWMController()
        except:
            logging.info('Device is arm, but does not support RPi.GPIO library.')
    if pwm_controller is None:
        pwm_controller = FakePWMController()
    light_manager = LightManager(pwm_controller)

    @app.route('/devices', methods=['GET'])
    def get_devices():
        return jsonify(device_manager.get_devices())

    @app.route('/devices/set_option', methods=['POST'])
    def set_option():
        option_value = OptionValueSchema().load(request.get_json())

        device_manager.set_device_option(
            option_value['bus_info'], option_value['option'], option_value['value'])

        return jsonify({})

    @app.route('/devices/get_next_port', methods=['GET'])
    def get_next_port():
        return jsonify({'port': device_manager.get_next_port(request.args.get('host'))})

    @app.route('/devices/configure_stream', methods=['POST'])
    def configure_stream():
        stream_info = StreamInfoSchema().load(request.get_json())

        device_manager.configure_device_stream(
            stream_info['bus_info'], stream_info)

        return jsonify({})

    @app.route('/devices/unconfigure_stream', methods=['POST'])
    def unconfigure_stream():
        bus_info = StreamInfoSchema(only=['bus_info']).load(
            request.get_json())['bus_info']

        device_manager.uncofigure_device_stream(bus_info)

        return jsonify({})
    
    @app.route('/logs', methods=['GET'])
    def get_logs():
        return jsonify(device_manager.get_logs())

    @app.route('/devices/set_nickname', methods=['POST'])
    def set_nickname():
        device_nickname = DeviceNicknameSchema().load(request.get_json())

        device_manager.set_device_nickname(
            device_nickname['bus_info'], device_nickname['nickname'])

        return jsonify({})

    @app.route('/devices/set_uvc_control', methods=['POST'])
    def set_uvc_control():
        uvc_control = UVCControlSchema().load(request.get_json())

        device_manager.set_device_uvc_control(
            uvc_control['bus_info'], uvc_control['control_id'], uvc_control['value'])

        return jsonify({})

    @app.route('/devices/leader_bus_infos')
    def get_leader_bus_infos():
        bus_infos = []
        for device in device_manager.devices:
            if device.device_type == DeviceType.STELLARHD_LEADER:
                bus_infos.append({
                    'nickname': device.nickname,
                    'bus_info': device.bus_info
                })

        return jsonify(bus_infos)

    @app.route('/devices/set_leader', methods=['POST'])
    def set_leader():
        leader_schema = DeviceLeaderSchema().load(request.get_json())
        device_manager.set_leader(leader_schema['leader'], leader_schema['follower'])
        return jsonify({})

    @app.route('/devices/remove_leader', methods=['POST'])
    def remove_leader():
        leader_schema = DeviceLeaderSchema().load(request.get_json())
        device_manager.remove_leader(leader_schema['follower'])
        return jsonify({})

    @app.route('/devices/restart_stream', methods=['POST'])
    def restart_stream():
        bus_info = StreamInfoSchema(only=['bus_info']).load(request.get_json())['bus_info']
        dev = device_manager._find_device_with_bus_info(bus_info)
        if not dev:
            logging.warn(f'Unable to find device {bus_info}')
            return jsonify({})
        dev.start_stream()
        return jsonify({})
    
    '''Lights'''
    @app.route('/lights')
    def get_lights():
        return jsonify(light_manager.get_lights())

    @app.route('/lights/set_light', methods=['POST'])
    def set_light():
        req = request.get_json()
        light = LightSchema().load(req['light'])
        light_manager.set_light(req['index'], Light(light['intensity'], light['pin'], light['type'], light['nickname']))
        return jsonify({})
    
    @app.route('/lights/remove_light', methods=['POST'])
    def remove_light():
        req = request.get_json()
        light_manager.remove_light(req['index'])
        return jsonify({})

    http_server = WSGIServer(('0.0.0.0', 8080), app, log=None)
    device_manager.start_monitoring()

    def exit_clean(sig, frame):
        logging.info('Shutting down')

        http_server.stop()
        device_manager.stop_monitoring()
        broadcast_server.kill()

        sys.exit(0)

    broadcast_server.run_in_background()
    signal.signal(signal.SIGINT, exit_clean)

    logging.info('Starting backend server on http://0.0.0.0:8080')
    http_server.serve_forever()


if __name__ == '__main__':
    main()
