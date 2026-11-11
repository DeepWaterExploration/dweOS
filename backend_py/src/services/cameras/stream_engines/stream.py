from dataclasses import dataclass, field

from backend_py.src.models import (
    IntervalModel,
    StreamEncodeTypeEnum,
    StreamEndpointModel,
    StreamTypeEnum,
)


@dataclass
class Stream:
    """
    Pure configuration object for a video stream.
    """

    device_path: str = ""
    # Bus info of the device this stream belongs to
    bus_info: str = ""
    encode_type: StreamEncodeTypeEnum = StreamEncodeTypeEnum.NONE
    stream_type: StreamTypeEnum = StreamTypeEnum.UDP
    endpoints: list[StreamEndpointModel] = field(default_factory=list)
    width: int = 1600
    height: int = 1200
    interval: IntervalModel = field(
        default_factory=lambda: IntervalModel(numerator=1, denominator=30)
    )
    enabled: bool = False
    # Synchronized recordings stream at 1/stream_scale of the recorded resolution
    stream_scale: int = 1

    # Configuration specific
    software_h264_bitrate: int = 5000
    file_path: str | None = None
