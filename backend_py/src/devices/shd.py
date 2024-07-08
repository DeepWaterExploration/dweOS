from ..enumeration import DeviceInfo
from ..device import Device

class SHDDevice(Device):
    '''
    Class for stellarHD devices
    '''

    def __init__(self, device_info: DeviceInfo) -> None:
        super().__init__(device_info)
