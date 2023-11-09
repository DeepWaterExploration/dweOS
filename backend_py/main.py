import time
from ctypes import *
import pprint

from enumeration import *
from camera_helper_loader import *
from schemas import *
from device import *


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
    device_schema = DeviceSchema()
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
            except:
                continue
            print(f'Device Added: {device_info.bus_info}')
            pprint.pprint(DeviceSchema().dump(device), depth=4)
            devices.append(device)
            old_device_list.append(device_info)

        # remove the old devices
        for device_info in removed_devices:
            for device in devices:
                if device.device_info == device_info:
                    devices.remove(device)
                    old_device_list.remove(device_info)
                    print(f'Device Removed: {device_info.bus_info}')

        time.sleep(0.1)


def main():
    monitor()


if __name__ == '__main__':
    main()
