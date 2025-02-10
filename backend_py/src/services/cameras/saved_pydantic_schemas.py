from pydantic import BaseModel
from typing import List, Optional

from .pydantic_schemas import StreamEndpointModel, IntervalModel, DeviceType, StreamEncodeTypeEnum, StreamTypeEnum


class SavedControlModel(BaseModel):
    control_id: int
    name: str
    value: int | float

    class Config:
        from_attributes = True

class SavedStreamModel(BaseModel):
    encode_type: StreamEncodeTypeEnum
    stream_type: StreamTypeEnum
    endpoints: List[StreamEndpointModel]
    width: int
    height: int
    interval: IntervalModel
    configured: bool

    class Config:
        use_enum_values = True
        from_attributes = True

class SavedDeviceModel(BaseModel):
    bus_info: str
    vid: int
    pid: int
    nickname: str
    stream: SavedStreamModel
    controls: List[SavedControlModel]
    device_type: DeviceType
    is_leader: Optional[bool] = None
    leader: Optional[str] = None

    class Config:
        from_attributes = True
        # use_enum_values = True

class SavedLeaderFollowerPairModel(BaseModel):
    leader_bus_info: str
    follower_bus_info: str

    class Config:
        from_attributes = True