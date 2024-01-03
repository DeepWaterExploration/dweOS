import time
from ctypes import *
import re
import sys
import signal

import threading
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

import logging

app = Flask(__name__)
CORS(app)
app.json.sort_keys = False

settings_manager = SettingsManager()
broadcast_server = BroadcastServer()
device_manager = DeviceManager(
    settings_manager=settings_manager, broadcast_server=broadcast_server)


@app.route('/devices', methods=['GET'])
def get_devices():
    return jsonify(device_manager.get_devices())


@app.route('/devices/set_option', methods=['POST'])
def set_option():
    option_value = OptionValueSchema().load(request.get_json())

    device_manager.set_device_option(
        option_value['bus_info'], option_value['option'], option_value['value'])

    return jsonify({})


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


def main():
    http_server = WSGIServer(('0.0.0.0', 8080), app)
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
