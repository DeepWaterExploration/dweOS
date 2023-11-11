import time
from ctypes import *
import pprint

from enumeration import *
from camera_helper_loader import *
from schemas import *
from device import *
from stream import *


# find the difference between lists
def list_diff(listA, listB):
    diff = []
    for element in listA:
        if element not in listB:
            diff.append(element)
    return diff


# monitor devices for changes
def monitor():
    devices: list[EHDDevice] = []
    old_device_list = []
    port = 5600

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
                device.configure_stream(
                    StreamEncodeTypeEnum.H264, 1920, 1080, Interval(1, 30), StreamTypeEnum.UDP, [StreamEndpoint('127.0.0.1', port)])
                port += 1
                device.stream.start()
                print(f'Device Added: {device_info.bus_info}')
                pprint.pprint(DeviceSchema().dump(
                    device), depth=2, compact=True, sort_dicts=False)
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
    monitor()


if __name__ == '__main__':
    main()
