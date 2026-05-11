"""
saved_cameras.py

Defines Pydantic models and Enums for persisting device settings and configs
Includes schemas for serializing device states (streams, controls, nicknames) to JSON,
keeping setting across reboots
"""

from pydantic import BaseModel

from .cameras import (
    DeviceType,
    IntervalModel,
    StreamEncodeTypeEnum,
    StreamEndpointModel,
    StreamTypeEnum,
)


class SavedControlModel(BaseModel):
    control_id: int
    name: str
    value: int | float

    class Config:
        from_attributes = True


class SavedStreamModel(BaseModel):
    encode_type: StreamEncodeTypeEnum
    stream_type: StreamTypeEnum
    endpoints: list[StreamEndpointModel]
    width: int
    height: int
    interval: IntervalModel
    enabled: bool

    class Config:
        # use_enum_values = True
        from_attributes = True


class SavedDeviceModel(BaseModel):
    bus_info: str
    vid: int
    pid: int
    nickname: str
    stream: SavedStreamModel
    controls: list[SavedControlModel]
    device_type: DeviceType
    followers: list[str] | None = []

    class Config:
        from_attributes = True
        # use_enum_values = True


class SavedLeaderFollowerPairModel(BaseModel):
    leader_bus_info: str
    follower_bus_info: str

    class Config:
        from_attributes = True
