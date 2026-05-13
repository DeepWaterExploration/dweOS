"""
enumeration.py

Searches the system for cameras using video4linux, create a DeviceInfo based on the
camera, and then maps that to the camera's bus_info,
and return a sorted list of device_infos
"""

import fcntl
import os
from dataclasses import dataclass

from natsort import natsorted

from . import v4l2


@dataclass
class DeviceInfo:
    device_name: str
    bus_info: str
    device_paths: list[str]
    vid: int
    pid: int


def _get_device_attr(device_path, attr) -> str:
    with open(device_path + "/" + attr, encoding="utf-8") as file_object:
        return file_object.read().strip()


def _get_vid_pid(devname) -> tuple[int, int] | None:
    cam_name = devname
    syspath = "/sys/class/video4linux/" + cam_name
    link = os.readlink(syspath) + "../../../../"
    device_path = os.path.abspath("/sys/class/video4linux/" + link)

    id_vendor_str = _get_device_attr(device_path, "idVendor")
    id_product_str = _get_device_attr(device_path, "idProduct")

    if not id_vendor_str or not id_product_str:
        return None

    return (
        int(id_vendor_str, base=16),
        int(id_product_str, base=16),
    )


def list_devices() -> list[DeviceInfo]:
    # traverse the directory that has the list of all devices
    devnames: list[str] = []
    try:
        devnames = os.listdir("/sys/class/video4linux/")
    except FileNotFoundError:
        return []
    devices_info: list[DeviceInfo] = []
    devices_map: dict[str, DeviceInfo] = {}
    for devname in devnames:
        devpath = f"/dev/{devname}"
        try:
            with open(devpath) as fd:
                cap = v4l2.v4l2_capability()
                fcntl.ioctl(fd, v4l2.VIDIOC_QUERYCAP, cap)
                fd.close()
                bus_info: str = bytes.decode(cap.bus_info)
                # Correct type of bus info
                if bus_info.startswith("usb"):
                    if bus_info in devices_map:
                        devices_map[bus_info].device_paths.append(devpath)
                    else:
                        device_name = cap.card.decode()
                        try:
                            vid_pid = _get_vid_pid(devname)
                            if not vid_pid:
                                # Never happens, just added this for linting
                                continue
                            (vid, pid) = vid_pid
                        except OSError:
                            continue
                        devices_map[bus_info] = DeviceInfo(
                            device_name, bus_info, [devpath], vid, pid
                        )
        except OSError:
            # Device was not initialized yet, just wait a bit
            continue

    # flatten the dict
    for _, device_info in devices_map.items():
        # sort the device paths in ascending order
        device_info.device_paths = natsorted(device_info.device_paths)
        devices_info.append(device_info)

    return devices_info
