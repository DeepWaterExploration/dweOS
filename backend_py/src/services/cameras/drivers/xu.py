"""
xu_controls.py

Specifies the constants of where each extension unit feature's register address is
stored
"""

from enum import Enum

DWE_DEVICE_TAG = 0x9A


class Unit(Enum):
    """
    SYS_ID: used for camera controls that are asic level

    USR_ID: used for camera controls that are more user facing
    """

    SYS_ID = 0x03  # Internal controls for the camera's ASIC
    USR_ID = 0x04  # User controls for the camera


class Selector(Enum):
    """
    Selectors for the camera extension unit controls
    """

    SYS_ASIC_RW = 0x01
    SYS_FLASH_CTRL = 0x03
    SYS_FRAME_INFO = 0x06
    SYS_H264_CTRL = 0x07
    SYS_MJPG_CTRL = 0x08
    SYS_OSD_CTRL = 0x09
    SYS_MOTION_DETECTION = 0x0A
    SYS_IMG_SETTING = 0x0B
    USR_FRAME_INFO = 0x01
    USR_H264_CTRL = 0x02
    USR_MJPG_CTRL = 0x03
    USR_OSD_CTRL = 0x04
    USR_MOTION_DETECTION = 0x05
    USR_IMG_SETTING = 0x06
    USR_MULTI_STREAM_CTRL = 0x07
    USR_GPIO_CTRL = 0x08
    USR_DYNAMIC_FPS_CTRL = 0x09


class Command(Enum):
    """
    Commands for the exploreHD extension unit controls
    """

    H264_BITRATE_CTRL = 0x02
    GOP_CTRL = 0x03
    H264_MODE_CTRL = 0x06


class StellarRegisterMap:
    """
    Map of stellar registers for the ASIC,
    which can be accessed through the SYS_ASIC_RW selector
    """

    REG_AE = 0x1673
    REG_ADDR_H = 0x1674
    REG_ADDR_L = 0x1675
    REG_DATA = 0x1676
    REG_MODE = 0x1677
    REG_TRIG = 0x1678
    REG_STROBE_ENABLED = 0x8100
    REG_HW_BITRATE_HIGH = 0x2D6
    REG_HW_BITRATE_LOW = 0x2D7
    REG_HW_BITRATE_TRIG = 0x2DB


class StellarSensorMap:
    """
    Map of sensor registers for stellar devices, which can be accessed through the ASIC
    """

    SHUTTER_HIGH = 0x3501
    SHUTTER_LOW = 0x3502
    ISO_HIGH = 0x3508
    ISO_LOW = 0x3509
    STROBE_WIDTH_HIGH = 0x3927
    STROBE_WIDTH_LOW = 0x3928
