from enum import Enum
from dataclasses import dataclass, field
from typing import List


class ControlTypeEnum(Enum):
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


class StreamEncodeTypeEnum(Enum):
    MJPG = 0
    H264 = 1


class StreamTypeEnum(Enum):
    UDP = 0


@dataclass
class StreamEndpoint:
    host: str
    port: int


class H264Mode(Enum):
    '''
    H.264 Mode Enum
    '''
    MODE_CONSTANT_BITRATE = 1
    MODE_VARIABLE_BITRATE = 2

class OptionTypeEnum(Enum):
    '''
    Option Type Enum
    This is for multiple cameras to all have unique options that can be configured separate from v4l2 controls
    '''
    TYPE_BOOLEAN=0
    TYPE_INTEGER=1
    TYPE_ENUM=2

@dataclass
class BaseOptionInfo:
    '''
    This is an option descriptor that will get serialized and sent to the frontend
    which allows for the frontend to configure the value
    '''
    option_type: OptionTypeEnum
    value: int | bool
    name: str
    default_value: int | bool

@dataclass
class SliderOptionInfo(BaseOptionInfo):
    option_type = OptionTypeEnum.TYPE_INTEGER
    min_value: int
    max_value: int
    step: int
    scale: float

@dataclass
class SwitchOptionInfo(BaseOptionInfo):
    option_type = OptionTypeEnum.TYPE_BOOLEAN
