import os
import fcntl
from dataclasses import dataclass
from enum import Enum
# import v4l2py
import v4l2
from ctypes import *

UVC_FUNCTIONS_SO_FILE = './uvc_functions.so'

uvc_functions = CDLL(UVC_FUNCTIONS_SO_FILE)


@dataclass
class DeviceInfo:

    device_name: str
    bus_info: str
    device_paths: list[str]


def list_devices():
    devices_info: list[DeviceInfo] = []
    devices_map: dict[str, DeviceInfo] = {}
    # traverse the directory that has the list of all devices
    devnames = os.listdir('/sys/class/video4linux/')
    for devname in devnames:
        devpath = f'/dev/{devname}'
        fd = open(devpath)
        cap = v4l2.v4l2_capability()
        fcntl.ioctl(fd, v4l2.VIDIOC_QUERYCAP, cap)
        fd.close()
        bus_info: str = bytes.decode(cap.bus_info)
        # Correct type of bus info
        if bus_info.startswith('usb'):
            if bus_info in devices_map:
                devices_map[bus_info].device_paths.append(devpath)
            else:
                devices_map[bus_info] = DeviceInfo(
                    'exploreHD', bus_info, [devpath])

    # flatten the dict
    for bus_info in devices_map:
        device_info = devices_map[bus_info]
        # sort the device paths in ascending order
        device_info.device_paths.sort()
        devices_info.append(device_info)

    return devices_info


class DeviceManager:

    def __init__(self) -> None:
        pass


class Camera:

    _path: str  # /dev/video#
    _fd: int  # fd created by uvc_functions

    def __init__(self, path) -> None:
        self._path = path
        self._fd = uvc_functions.open_camera(self._path)

    def __del__(self):
        # close the fd
        uvc_functions.close_camera(self._fd)

    # uvc_set_ctrl function defined in uvc_functions.c
    def uvc_set_ctrl(self, unit, ctrl, data, size):
        return uvc_functions.uvc_set_ctrl(self._fd, unit, ctrl, data, size)

    # uvc_get_ctrl function defined in uvc_functions.c
    def uvc_get_ctrl(self, unit, ctrl, data, size):
        return uvc_functions.uvc_get_ctrl(self._fd, unit, ctrl, data, size)


class Option:

    def __init__(self) -> None:
        pass

    def set_value(value: bytes):
        pass


class Device:

    def __init__(self) -> None:
        pass


if __name__ == '__main__':
    devices_info = list_devices()
    print(devices_info)

    fd = uvc_functions.open_camera(b'/dev/video2')

    # get the bitrate
    data = bytes([0x9A, 0x02, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    uvc_functions.uvc_set_ctrl(fd, 0x04, 0x02, data, 11)
    uvc_functions.uvc_get_ctrl(fd, 0x04, 0x02, data, 11)
    print((data[0] << 24) | (data[1] << 16) | (data[2] << 8) | (data[3]))

    uvc_functions.close_camera(fd)
