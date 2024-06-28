from typing import Dict
from typing import Dict
from .enumeration import DeviceInfo
from .device import Device, Option
from .camera_types import H264Mode
from . import ehd_controls as xu

class EHDDevice(Device):

    def __init__(self, device_info: DeviceInfo) -> None:
        super().__init__('exploreHD', 'DeepWater Exploration Inc.', device_info)

    def _get_options(self) -> Dict[str, Option]:
        options = {}

        # UVC xu bitrate control
        options['bitrate'] = Option(
            self.cameras[2], '>I', xu.Unit.USR_ID, xu.Selector.USR_H264_CTRL, xu.Command.H264_BITRATE_CTRL)

        # UVC xu gop control
        options['gop'] = Option(
            self.cameras[2], 'H', xu.Unit.USR_ID, xu.Selector.USR_H264_CTRL, xu.Command.GOP_CTRL)

        # UVC xu H264 mode control
        options['mode'] = Option(
            self.cameras[2], 'B', xu.Unit.USR_ID, xu.Selector.USR_H264_CTRL, xu.Command.H264_MODE_CTRL, lambda mode : mode.value, lambda mode_value : H264Mode(mode_value))

        return options

