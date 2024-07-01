from typing import Dict
from ..enumeration import DeviceInfo
from ..device import Device, Option
from ..camera_types import H264Mode
from .. import ehd_controls as xu

class EHDDevice(Device):
    '''
    Class for exploreHD devices
    '''

    def __init__(self, device_info: DeviceInfo) -> None:
        super().__init__(device_info)

    def _get_options(self) -> Dict[str, Option]:
        options = {}

        # UVC xu bitrate control
        # Standard integer options
        options['bitrate'] = Option(
            self.cameras[2], '>I', xu.Unit.USR_ID, xu.Selector.USR_H264_CTRL, xu.Command.H264_BITRATE_CTRL)

        # UVC xu gop control
        options['gop'] = Option(
            self.cameras[2], 'H', xu.Unit.USR_ID, xu.Selector.USR_H264_CTRL, xu.Command.GOP_CTRL)

        # UVC xu H264 mode control
        # We want the mode option to be true or false
        #   true indicates variable bitrate and false indicates constant bitrate
        # Maybe rename mode to vbr etc.
        options['mode'] = Option(
            self.cameras[2], 'B', xu.Unit.USR_ID, xu.Selector.USR_H264_CTRL, xu.Command.H264_MODE_CTRL, 
                lambda mode : H264Mode.MODE_VARIABLE_BITRATE if mode.value else H264Mode.MODE_CONSTANT_BITRATE, 
                lambda mode_value : H264Mode(mode_value) == H264Mode.MODE_VARIABLE_BITRATE)

        return options

