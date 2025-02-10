from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from enum import Enum, IntEnum

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

class StreamEncodeTypeEnum(str, Enum):
    MJPG = 'MJPG'
    H264 = 'H264'

class StreamTypeEnum(str, Enum):
    UDP = 'UDP'


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


class IntervalModel(BaseModel):
    numerator: int
    denominator: int

    class Config:
        from_attributes = True


class FormatSizeModel(BaseModel):
    width: int
    height: int
    intervals: List[IntervalModel]

    class Config:
        from_attributes = True


class CameraModel(BaseModel):
    path: str
    formats: Dict[str, List[FormatSizeModel]]

    class Config:
        from_attributes = True


class MenuItemModel(BaseModel):
    index: int
    name: str

    class Config:
        from_attributes = True


class ControlFlagsModel(BaseModel):
    default_value: float
    max_value: float
    min_value: float
    step: float
    control_type: ControlTypeEnum = Field(...)
    menu: List[MenuItemModel] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ControlModel(BaseModel):
    flags: ControlFlagsModel
    control_id: int
    name: str
    value: float

    class Config:
        from_attributes = True


class DeviceInfoModel(BaseModel):
    device_name: str
    bus_info: str
    device_paths: List[str]
    vid: int
    pid: int

    class Config:
        from_attributes = True


class DeviceOptionsModel(BaseModel):
    bitrate: int
    gop: int
    mode: H264Mode

    class Config:
        from_attributes = True


class StreamEndpointModel(BaseModel):
    host: str
    port: int

    class Config:
        from_attributes = True


class StreamModel(BaseModel):
    device_path: str
    encode_type: StreamEncodeTypeEnum
    stream_type: StreamTypeEnum
    endpoints: List[StreamEndpointModel]
    width: int
    height: int
    interval: IntervalModel
    configured: bool

    class Config:
        from_attributes = True


class DeviceModel(BaseModel):
    cameras: Optional[List[CameraModel]] = None
    controls: List[ControlModel]
    stream: StreamModel
    name: Optional[str] = None
    vid: int
    pid: int
    bus_info: str
    manufacturer: Optional[str] = None
    nickname: str
    device_info: Optional[DeviceInfoModel] = None
    device_type: DeviceType
    is_leader: Optional[bool] = None
    leader: Optional[str] = None
    follower: Optional[str] = None

    class Config:
        from_attributes = True
        use_enum_values = True


# API SCHEMAS

class StreamFormatModel(BaseModel):
    width: int
    height: int
    interval: IntervalModel

    class Config:
        from_attributes = True

class StreamInfoModel(BaseModel):
    bus_info: str
    stream_format: StreamFormatModel
    encode_type: StreamEncodeTypeEnum
    endpoints: List[StreamEndpointModel]

    class Config:
        from_attributes = True

class UVCControlModel(BaseModel):
    bus_info: str
    control_id: int
    value: float | int

    class Config:
        from_attributes = True

class DeviceNicknameModel(BaseModel):
    bus_info: str
    nickname: str

    class Config:
        from_attributes = True


class DeviceLeaderModel(BaseModel):
    follower: str
    leader: Optional[str] = None

    class Config:
        from_attributes = True

class DeviceDescriptorModel(BaseModel):
    bus_info: str
