from typing import Dict
from ..enumeration import DeviceInfo
from ..device import Device, Option
from ..camera_types import H264Mode
from .. import ehd_controls as xu

class SHDDevice(Device):
    '''
    Class for exploreHD devices
    '''

    def __init__(self, device_info: DeviceInfo) -> None:
        super().__init__(device_info)
