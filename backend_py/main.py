import time
from ctypes import *
import pprint

from enumeration import *
from camera_helper_loader import *
from schemas import *
from device import *
from stream import *

import threading

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.json.sort_keys = False
devices: list[EHDDevice] = []


def find_device_with_bus_info(bus_info: str) -> (EHDDevice | None):
    for device in devices:
        if device.bus_info == bus_info:
            return device
    return None


@app.route('/devices', methods=['GET'])
def get_devices():
    return jsonify(DeviceSchema().dump(devices, many=True))


@app.route('/devices/set_option', methods=['POST'])
def set_option():
    option_value = OptionValueSchema().load(request.get_json())
    device = find_device_with_bus_info(option_value['bus_info'])
    value = option_value['value']
    match option_value['option']:
        case OptionTypeEnum.BITRATE:
            device.set_bitrate(value)
        case OptionTypeEnum.MODE:
            device.set_mode(value)
        case OptionTypeEnum.GOP:
            device.set_gop(value)
    return jsonify({})


def list_diff(listA, listB):
    # find the difference between lists
    diff = []
    for element in listA:
        if element not in listB:
            diff.append(element)
    return diff


def save_device(device: EHDDevice):
    pass


def monitor(devices):
    # monitor devices for changes
    old_device_list = []

    try:
        while True:
            devices_info = list_devices()

            # find the new devices
            new_devices = list_diff(devices_info, old_device_list)

            # find the removed devices
            removed_devices = list_diff(old_device_list, devices_info)

            # add the new devices
            for device_info in new_devices:
                if not is_ehd(device_info):
                    continue
                # if the device is not ready (essentially meaning the linux filesystem has not been populated yet),
                # this will error, resulting in the loop continuing
                # yes, this is a bit hacky, but there is no real cleaner way of doing this
                device = None
                try:
                    device = EHDDevice(device_info)
                except Exception as e:
                    print(e)
                    continue
                print(f'Device Added: {device_info.bus_info}')
                pprint.pprint(DeviceSchema(
                    only=['vid', 'pid', 'nickname', 'bus_info', 'stream', 'controls', 'options'], exclude=['stream.device_path', 'controls.flags']).dump(
                    device), depth=1, compact=True, sort_dicts=False)
                # append the device to the device list
                devices.append(device)
                # add the device info to the device list
                old_device_list.append(device_info)

            # remove the old devices
            for device_info in removed_devices:
                for device in devices:
                    if device.device_info == device_info:
                        devices.remove(device)
                        # remove the device info from the old device list
                        old_device_list.remove(device_info)
                        print(f'Device Removed: {device_info.bus_info}')

            # do not overload the bus
            time.sleep(0.1)
    except KeyboardInterrupt:
        for device in devices:
            device.stream.stop()


def main():
    monitor_process = threading.Thread(target=monitor, args=[devices])

    monitor_process.start()
    app.run(port=8080)


if __name__ == '__main__':
    main()
