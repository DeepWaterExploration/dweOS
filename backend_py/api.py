from device import EHDDevice, Interval
from dataclasses import dataclass


# @dataclass
# class StreamFormat:
#     width: int
#     height: int
#     interval: Interval


# @dataclass
# class StreamInfo:
#     bus_info: str
#     stream_format: StreamFormat


# class OptionTypeEnum(Enum):
#     BITRATE = 'bitrate'
#     GOP = 'gop'
#     MODE = 'mode'


# @dataclass
# class OptionValue:
#     bus_info: str
#     option: OptionTypeEnum
#     value: int | EHDDevice.H264Mode
