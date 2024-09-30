from dataclasses import dataclass
from . import v4l2
import fcntl
import os
from natsort import natsorted
import logging
from typing import List, Dict


@dataclass
class DeviceInfo:

    device_name: str
    bus_info: str
    device_paths: list[str]
    vid: int
    pid: int


def _get_device_attr(device_path, attr):
    file_object = open(device_path + '/' + attr)
    return file_object.read().strip()


def _get_vid_pid(devname):
    cam_name = devname
    syspath = '/sys/class/video4linux/' + cam_name
    link = os.readlink(syspath) + '../../../../'
    device_path = os.path.abspath(
        '/sys/class/video4linux/' + link)
    return (int(_get_device_attr(device_path, 'idVendor'), base=16), int(_get_device_attr(device_path, 'idProduct'), base=16))


def list_devices():
    # traverse the directory that has the list of all devices
    devnames: List[str] = []
    try:
        devnames = os.listdir('/sys/class/video4linux/')
    except FileNotFoundError as e:
        return []
    devices_info: List[DeviceInfo] = []
    devices_map: Dict[str, DeviceInfo] = {}
    for devname in devnames:
        devpath = f'/dev/{devname}'
        try:
            fd = open(devpath)
        except:
            # Device was not initialized yet, just wait a bit
            continue
        cap = v4l2.v4l2_capability()
        fcntl.ioctl(fd, v4l2.VIDIOC_QUERYCAP, cap)
        fd.close()
        bus_info: str = bytes.decode(cap.bus_info)
        # Correct type of bus info
        if bus_info.startswith('usb'):
            if bus_info in devices_map:
                devices_map[bus_info].device_paths.append(devpath)
            else:
                device_name = cap.card.decode()
                (vid, pid) = _get_vid_pid(devname)
                devices_map[bus_info] = DeviceInfo(
                    device_name, bus_info, [devpath], vid, pid)

    # flatten the dict
    for bus_info in devices_map:
        device_info = devices_map[bus_info]
        # sort the device paths in ascending order
        device_info.device_paths = natsorted(device_info.device_paths)
        devices_info.append(device_info)

    return devices_info
