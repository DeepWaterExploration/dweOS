from dataclasses import dataclass
import v4l2
import fcntl
import os


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
