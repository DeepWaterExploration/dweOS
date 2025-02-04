from pydantic import BaseModel
from typing import List, Optional

from .stream import StreamEncodeTypeEnum, StreamTypeEnum, StreamEndpoint, Interval
from .camera_types import DeviceType
from .pydantic_schemas import StreamEndpointSchema


class SavedControlSchema(BaseModel):
    control_id: int
    name: str
    value: int

    class Config:
        from_attributes = True

class SavedStreamSchema(BaseModel):
    encode_type: StreamEncodeTypeEnum
    stream_type: StreamTypeEnum
    endpoints: List[StreamEndpointSchema]
    width: int
    height: int
    interval: Interval
    configured: bool

    class Config:
        use_enum_values = True
        from_attributes = True

class SavedDeviceSchema(BaseModel):
    bus_info: str
    vid: int
    pid: int
    nickname: str
    stream: SavedStreamSchema
    controls: List[SavedControlSchema]
    device_type: DeviceType
    is_leader: bool
    leader: Optional[str]

    class Config:
        from_attributes = True
        # use_enum_values = True

class SavedLeaderFollowerPairSchema(BaseModel):
    leader_bus_info: str
    follower_bus_info: str

    class Config:
        from_attributes = True