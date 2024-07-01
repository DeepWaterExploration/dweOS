from src.devices.ehd import EHDDevice
from src.devices.shd import SHDDevice
from src.device import DeviceType, lookup_pid_vid, DeviceInfo, Device
from src.enumeration import list_devices

def create_device(device_info: DeviceInfo) -> Device | None:
    (_, device_type) = lookup_pid_vid(device_info.vid, device_info.pid)

    match device_type:
        case DeviceType.EXPLOREHD:
            return EHDDevice(device_info)
        case DeviceType.STELLARHD:
            return SHDDevice(device_info)
        case _:
            # Not a DWE device
            return None

if __name__ == '__main__':
    devices = list_devices()
    for device_info in devices:
        dev = create_device(device_info)
        print(dev.name)

