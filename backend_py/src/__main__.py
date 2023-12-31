import time
from ctypes import *
import pprint
import re
import sys
import signal

import threading
from flask import Flask, jsonify, request
from flask_cors import CORS
from gevent.pywsgi import WSGIServer

from enumeration import *
from camera_helper_loader import *
from schemas import *
from device import *
from stream import *
from settings import SettingsManager
from utils import list_diff
from broadcast_server import BroadcastServer, Message

app = Flask(__name__)
CORS(app)
app.json.sort_keys = False
devices: list[EHDDevice] = []
settings_manager = SettingsManager()
broadcast_server = BroadcastServer()

is_monitoring = True

# only include the values needed for deserialization
save_device_schema = DeviceSchema(
                    only=['vid', 'pid', 'nickname', 'bus_info', 'stream', 'controls', 'options'], exclude=['stream.device_path', 'controls.flags'])

def find_device_with_bus_info(bus_info: str) -> (EHDDevice | None):
    for device in devices:
        if device.bus_info == bus_info:
            return device
    return None


@app.route('/devices', methods=['GET'])
def get_devices():
    device_list = DeviceSchema().dump(devices, many=True)
    key_pattern = re.compile(r'^(\D+)(\d+)$')
    def key(item: Dict):
        # Get the integer at the end of the path
        try:
            m = key_pattern.match(item['cameras'][0]['path'])
            return int(m.group(2))
        except:
            return -1
    device_list.sort(key=key)
    return jsonify(device_list)


@app.route('/devices/set_option', methods=['POST'])
def set_option():
    option_value = OptionValueSchema().load(request.get_json())
    device = find_device_with_bus_info(option_value['bus_info'])

    if not device:
        return jsonify({})
    value = option_value['value']
    match option_value['option']:
        case OptionTypeEnum.BITRATE:
            device.set_bitrate(value)
        case OptionTypeEnum.MODE:
            device.set_mode(value)
        case OptionTypeEnum.GOP:
            device.set_gop(value)
    settings_manager.save_device(device)
    return jsonify({})


@app.route('/devices/configure_stream', methods=['POST'])
def configure_stream():
    stream_info = StreamInfoSchema().load(request.get_json())
    device = find_device_with_bus_info(stream_info['bus_info'])

    if not device:
        return jsonify({})

    stream_format = stream_info['stream_format']
    width: int = stream_format['width']
    height: int = stream_format['height']
    interval: Interval = Interval(
        stream_format['interval']['numerator'], stream_format['interval']['denominator'])
    encode_type: StreamEncodeTypeEnum = stream_info['encode_type']
    endpoints = stream_info['endpoints']

    device.configure_stream(encode_type, width, height,
                            interval, StreamTypeEnum.UDP, endpoints)
    device.stream.start()
    settings_manager.save_device(device)
    return jsonify({})

@app.route('/devices/unconfigure_stream', methods=['POST'])
def unconfigure_stream():
    bus_info = StreamInfoSchema(only=['bus_info']).load(request.get_json())['bus_info']
    device = find_device_with_bus_info(bus_info)
    if not device:
        return jsonify({})
    
    device.unconfigure_stream()
    settings_manager.save_device(device)
    return jsonify({})

@app.route('/devices/set_nickname', methods=['POST'])
def set_nickname():
    device_nickname = DeviceNicknameSchema().load(request.get_json())
    device = find_device_with_bus_info(device_nickname['bus_info'])
    if not device:
        return jsonify({})
    nickname = device_nickname['nickname']
    device.nickname = nickname
    settings_manager.save_device(device)
    return jsonify({})

@app.route('/devices/set_uvc_control', methods=['POST'])
def set_uvc_control():
    uvc_control = UVCControlSchema().load(request.get_json())
    print(uvc_control)
    device = find_device_with_bus_info(uvc_control['bus_info'])
    if not device:
        return jsonify({})
    control_id = uvc_control['control_id']
    value = uvc_control['value']
    device.set_pu(control_id, value)
    settings_manager.save_device(device)
    return jsonify({})

def monitor(devices):
    # monitor devices for changes
    devices_info = list_devices()

    for device_info in devices_info:
        if not is_ehd(device_info):
            continue
        device = None
        try:
            device = EHDDevice(device_info)
        except Exception as e:
            print(e)
            continue
        # append the device to the device list
        devices.append(device)
        # load the settings
        settings_manager.load_device(device)

    old_device_list = devices_info

    while is_monitoring:
        devices_info = list_devices()

        # find the new devices
        new_devices = list_diff(devices_info, old_device_list)

        # find the removed devices
        removed_devices = list_diff(old_device_list, devices_info)

        # add the new devices
        for device_info in new_devices:
            if not is_ehd(device_info):
                continue
            device = None
            try:
                device = EHDDevice(device_info)
            except Exception as e:
                print(e)
                continue
            # append the device to the device list
            devices.append(device)
            # load the settings
            settings_manager.load_device(device)
            # add the device info to the device list
            old_device_list.append(device_info)

            # Output device to log (after loading settings)
            print(f'Device Added: {device_info.bus_info}')
            pprint.pprint(DeviceSchema(
                only=['vid', 'pid', 'nickname', 'bus_info', 'stream', 'controls', 'options'], exclude=['stream.device_path', 'controls.flags']).dump(
                device), depth=1, compact=True, sort_dicts=False)
            
            broadcast_server.broadcast(Message(
                'device_added', DeviceSchema().dump(device)
            ))

        # remove the old devices
        for device_info in removed_devices:
            for device in devices:
                if device.device_info == device_info:
                    device.stream.stop()
                    devices.remove(device)
                    # remove the device info from the old device list
                    old_device_list.remove(device_info)
                    print(f'Device Removed: {device_info.bus_info}')

                    broadcast_server.broadcast(Message('device_removed', {
                        'bus_info': device_info.bus_info
                    }))

        # do not overload the bus
        time.sleep(0.1)

def main():
    monitor_process = threading.Thread(target=monitor, args=[devices])
    monitor_process.start()
    http_server = WSGIServer(('0.0.0.0', 8080), app)

    def exit_clean(sig, frame):
        http_server.stop()

        for device in devices:
            device.stream.stop()
        
        broadcast_server.kill()

        global is_monitoring
        is_monitoring = False
        monitor_process.join()

        sys.exit(0)


    broadcast_server.run_in_background()
    signal.signal(signal.SIGINT, exit_clean)

    http_server.serve_forever()


if __name__ == '__main__':
    main()
