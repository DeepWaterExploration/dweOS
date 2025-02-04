from enum import IntEnum, Enum
from dataclasses import dataclass, field
from typing import List


class ControlTypeEnum(IntEnum):
    INTEGER = 1
    BOOLEAN = 2
    MENU = 3
    BUTTON = 4
    INTEGER64 = 5
    CTRL_CLASS = 6
    STRING = 7
    BITMASK = 8
    INTEGER_MENU = 9


@dataclass
class Interval:
    numerator: int = 1
    denominator: int = 30


@dataclass
class FormatSize:
    width: int
    height: int
    intervals: list[Interval]


@dataclass
class MenuItem:
    index: int
    name: str


@dataclass
class ControlFlags:
    default_value: int = 0
    max_value: int = 0
    min_value: int = 0
    step: int = 0
    control_type: ControlTypeEnum = ControlTypeEnum.INTEGER
    menu: List[MenuItem] = field(default_factory=list)


@dataclass
class Control:
    control_id: int
    name: str
    value: int
    flags: ControlFlags = field(default_factory=ControlFlags)


class StreamEncodeTypeEnum(str, Enum):
    MJPG = 'MJPG'
    H264 = 'H264'


class StreamTypeEnum(str, Enum):
    UDP = 'UDP'


@dataclass
class StreamEndpoint:
    host: str
    port: int


class H264Mode(IntEnum):
    '''
    H.264 Mode Enum
    '''
    MODE_CONSTANT_BITRATE = 1
    MODE_VARIABLE_BITRATE = 2

class DeviceType(IntEnum):
    '''
    Device type Enum
    '''
    EXPLOREHD = 0
    STELLARHD_LEADER= 1
    STELLARHD_FOLLOWER = 2
