from pydantic import BaseModel
from typing import List, Dict, Optional
from .camera_types import *
from .saved_types import *
from .device import DeviceType


class CameraIntervalSchema(BaseModel):
    numerator: int
    denominator: int

    class Config:
        from_attributes = True


class CameraFormatSizeSchema(BaseModel):
    width: int
    height: int
    intervals: List[CameraIntervalSchema]

    class Config:
        from_attributes = True


class CameraSchema(BaseModel):
    path: str
    formats: Dict[str, List[CameraFormatSizeSchema]]

    class Config:
        from_attributes = True


class MenuItemSchema(BaseModel):
    index: int
    name: str

    class Config:
        from_attributes = True


class ControlFlagsSchema(BaseModel):
    default_value: float
    max_value: float
    min_value: float
    step: float
    control_type: ControlTypeEnum
    menu: List[MenuItemSchema]

    class Config:
        from_attributes = True
        use_enum_values = True


class ControlSchema(BaseModel):
    flags: ControlFlagsSchema
    control_id: int
    name: str
    value: float

    class Config:
        from_attributes = True


class DeviceInfoSchema(BaseModel):
    device_name: str
    bus_info: str
    device_paths: List[str]
    vid: int
    pid: int

    class Config:
        from_attributes = True


class DeviceOptionsSchema(BaseModel):
    bitrate: int
    gop: int
    mode: H264Mode

    class Config:
        from_attributes = True


class StreamEndpointSchema(BaseModel):
    host: str
    port: int

    class Config:
        from_attributes = True


class StreamSchema(BaseModel):
    device_path: str
    encode_type: StreamEncodeTypeEnum
    stream_type: StreamTypeEnum
    endpoints: List[StreamEndpointSchema]
    width: int
    height: int
    interval: CameraIntervalSchema
    configured: bool

    class Config:
        from_attributes = True


class DeviceSchema(BaseModel):
    cameras: Optional[List[CameraSchema]] = None
    controls: List[ControlSchema]
    stream: StreamSchema
    name: Optional[str] = None
    vid: int
    pid: int
    bus_info: str
    manufacturer: Optional[str] = None
    nickname: str
    device_info: Optional[DeviceInfoSchema] = None
    device_type: DeviceType
    is_leader: Optional[bool] = None
    leader: Optional[str] = None
    follower: Optional[str] = None

    class Config:
        from_attributes = True
        use_enum_values = True


# API SCHEMAS

class StreamFormatSchema(BaseModel):
    width: int
    height: int
    interval: CameraIntervalSchema

    class Config:
        from_attributes = True

class StreamInfoSchema(BaseModel):
    bus_info: str
    stream_format: StreamFormatSchema
    encode_type: StreamEncodeTypeEnum
    endpoints: List[StreamEndpointSchema]

    class Config:
        from_attributes = True


class DeviceNicknameSchema(BaseModel):
    bus_info: str
    nickname: str

    class Config:
        from_attributes = True


class UVCControlSchema(BaseModel):
    bus_info: str
    control_id: int
    value: int

    class Config:
        from_attributes = True


class DeviceLeaderSchema(BaseModel):
    follower: str
    leader: Optional[str] = None

    class Config:
        from_attributes = True

class DeviceDescriptorSchema(BaseModel):
    bus_info: str
