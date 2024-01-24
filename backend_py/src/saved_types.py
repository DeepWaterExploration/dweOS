from dataclasses import dataclass
from typing import *

from .stream import StreamEncodeTypeEnum, StreamTypeEnum, StreamEndpoint, Interval
from .camera_types import H264Mode


@dataclass
class SavedControl:
    control_id: int
    name: str
    value: int


@dataclass
class SavedStream:
    encode_type: StreamEncodeTypeEnum
    stream_type: StreamTypeEnum
    endpoints: List[StreamEndpoint]
    width: int
    height: int
    interval: Interval
    configured: bool


@dataclass
class SavedOptions:
    bitrate: int
    gop: int
    mode: H264Mode


@dataclass
class SavedDevice:
    bus_info: str
    vid: int
    pid: int
    nickname: str
    stream: SavedStream
    options: SavedOptions
    controls: List[SavedControl]
