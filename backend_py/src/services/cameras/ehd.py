from typing import Dict
from .enumeration import DeviceInfo
from .device import Device, Option, ControlTypeEnum
from .camera_types import H264Mode
from . import ehd_controls as xu

class EHDDevice(Device):
    '''
    Class for exploreHD devices
    '''

    def __init__(self, device_info: DeviceInfo) -> None:
        super().__init__(device_info)

        self.add_control_from_option(
            'vbr', False, ControlTypeEnum.BOOLEAN
        )

        self.add_control_from_option(
            'gop', 29, ControlTypeEnum.INTEGER, 29, 0, 1 
        )
        
        self.add_control_from_option(
            'bitrate', 10, ControlTypeEnum.INTEGER, 15, 0.1, 0.1
        )

    def _get_options(self) -> Dict[str, Option]:
        options = {}

        # UVC xu bitrate control
        # Standard integer options
        options['bitrate'] = Option(
            self.cameras[2], '>I', xu.Unit.USR_ID, xu.Selector.USR_H264_CTRL, xu.Command.H264_BITRATE_CTRL, 'Bitrate', 
            lambda bitrate: int(bitrate * 1000000), # convert to bps from mpbs 
            lambda bitrate: bitrate / 1000000  # convert to mpbs from bps
        )

        # UVC xu gop control
        options['gop'] = Option(
            self.cameras[2], 'H', xu.Unit.USR_ID, xu.Selector.USR_H264_CTRL, xu.Command.GOP_CTRL, 'Group of Pictures')

        # UVC xu H264 mode control
        # We want the mode option to be true or false
        #   true indicates variable bitrate and false indicates constant bitrate
        # Maybe rename mode to vbr etc.
        options['vbr'] = Option(
            self.cameras[2], 'B', xu.Unit.USR_ID, xu.Selector.USR_H264_CTRL, xu.Command.H264_MODE_CTRL, 'Variable Bitrate',
                lambda mode : H264Mode.MODE_VARIABLE_BITRATE.value if mode else H264Mode.MODE_CONSTANT_BITRATE.value, 
                lambda mode_value : H264Mode(mode_value) == H264Mode.MODE_VARIABLE_BITRATE)

        return options

