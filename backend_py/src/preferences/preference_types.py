from dataclasses import dataclass
from ..camera_types import StreamEndpoint

@dataclass
class SavedPrefrences:
    default_stream: StreamEndpoint
