from .enumeration import DeviceInfo
from .device import Device

class StellarDevice(Device):

    def __init__(self, device_info: DeviceInfo) -> None:
        super().__init__(device_info)

    
