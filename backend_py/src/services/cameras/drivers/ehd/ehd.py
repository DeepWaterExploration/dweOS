"""
ehd.py

Adds additional features to exploreHD devices through extension units (xu)
as per UVC protocol
Uses options functionality to set defaults, ranges, and specifies registers for where
these features store data
"""

from ..device import Device, DeviceMetadata
from ..video4linux.enumeration import DeviceInfo
from .options import EHDBitrateOption, EHDGOPOption, EHDH264ModeOption


class EHDDevice(Device):
    """
    Class for exploreHD devices
    """

    def __init__(
        self, device_info: DeviceInfo, device_metadata: DeviceMetadata
    ) -> None:
        super().__init__(device_info, device_metadata)

        self._options = {
            "bitrate": EHDBitrateOption(self.cameras[2]),
            "gop": EHDGOPOption(self.cameras[2]),
            "vbr": EHDH264ModeOption(self.cameras[2]),
        }

        self.add_control_from_option("gop")
        self.add_control_from_option("bitrate")
        self.add_control_from_option("vbr")
