from dataclasses import dataclass, field
from ..pydantic_schemas import *


@dataclass
class Stream:
    """
    Pure configuration object for a video stream.
    """
    device_path: str = ""
    encode_type: StreamEncodeTypeEnum = None
    stream_type: StreamTypeEnum = StreamTypeEnum.UDP
    endpoints: List[StreamEndpointModel] = field(default_factory=list)
    width: Optional[int] = None
    height: Optional[int] = None
    interval: IntervalModel = field(
        default_factory=lambda: IntervalModel(numerator=1, denominator=30)
    )
    enabled: bool = False

    # Configuration specific
    software_h264_bitrate: int = 5000
    file_path: Optional[str] = None
