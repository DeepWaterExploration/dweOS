"""
pydantic_schemas.py

Defines Pydantic models and Enums for camera and device configs
Includes schemas for streams, controls, device info, and API request/response strutures
"""

from enum import Enum, IntEnum

from pydantic import BaseModel, Field


class V4LControlTypeEnum(IntEnum):
    INTEGER = 1
    BOOLEAN = 2
    MENU = 3
    BUTTON = 4
    INTEGER64 = 5
    CTRL_CLASS = 6
    STRING = 7
    BITMASK = 8
    INTEGER_MENU = 9


class ControlTypeEnum(str, Enum):
    INTEGER = "INTEGER"
    BOOLEAN = "BOOLEAN"
    MENU = "MENU"
    BUTTON = "BUTTON"
    INTEGER64 = "INTEGER64"
    CTRL_CLASS = "CTRL_CLASS"
    STRING = "STRING"
    BITMASK = "BITMASK"
    INTEGER_MENU = "INTEGER_MENU"


class StreamEncodeTypeEnum(str, Enum):
    MJPG = "MJPG"
    H264 = "H264"
    SOFTWARE_H264 = "SOFTWARE_H264"
    NONE = "NONE"


class StreamTypeEnum(str, Enum):
    UDP = "UDP"

    RECORDING = "RECORDING"


class H264Mode(IntEnum):
    """
    H.264 Mode Enum
    """

    MODE_CONSTANT_BITRATE = 1
    MODE_VARIABLE_BITRATE = 2


class DeviceType(IntEnum):
    """
    Device type Enum
    """

    EXPLOREHD = 0
    STELLARHD_LEADER = 1
    STELLARHD_FOLLOWER = 2
    STELLARHD_LEADER_PRO = 3
    STELLARHD_FOLLOWER_PRO = 4


class IntervalModel(BaseModel):
    numerator: int
    denominator: int

    class Config:
        from_attributes = True


class FormatSizeModel(BaseModel):
    width: int
    height: int
    intervals: list[IntervalModel]

    class Config:
        from_attributes = True


class CameraModel(BaseModel):
    path: str
    formats: dict[str, list[FormatSizeModel]]

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
    menu: list[MenuItemModel] = Field(default_factory=list)

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
    device_paths: list[str]
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
    endpoints: list[StreamEndpointModel]
    width: int
    height: int
    interval: IntervalModel
    enabled: bool

    class Config:
        from_attributes = True


class FrameDropStats(BaseModel):
    num_drops: int
    drops_per_second: float


class DeviceModel(BaseModel):
    # List of cameras, e.g. /dev/video0, /dev/video2
    cameras: list[CameraModel] | None = None
    # List of camera controls and their values, default values, etc.
    controls: list[ControlModel]
    # Stores information about the stream
    stream: StreamModel
    # e.g. exploreHD
    name: str | None = None
    vid: int
    pid: int
    # usb-0000:00: ... to uniquely identify the port
    bus_info: str
    # DWE.ai
    manufacturer: str | None = None
    # device nickname
    nickname: str
    # initial information used to construct the object, redundant data...
    device_info: DeviceInfoModel | None = None
    # 0 (exploreHD), 1 (Leader), 2 (Follower)
    device_type: DeviceType
    # Only required for stellarHD
    # (remember, followers CAN be leaders in some circumstances)
    followers: list[str] = []
    # True if is a follower and stream is managed by the leader
    is_managed: bool = False

    class Config:
        from_attributes = True


# API SCHEMAS


class StreamFormatModel(BaseModel):
    width: int
    height: int
    interval: IntervalModel

    class Config:
        from_attributes = True


class StreamInfoModel(BaseModel):
    bus_info: str
    stream_type: StreamTypeEnum
    stream_format: StreamFormatModel
    encode_type: StreamEncodeTypeEnum
    enabled: bool
    endpoints: list[StreamEndpointModel]

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
    leader: str | None = None

    class Config:
        from_attributes = True


class DeviceDescriptorModel(BaseModel):
    bus_info: str


class AddFollowerPayload(BaseModel):
    leader_bus_info: str
    follower_bus_info: str
