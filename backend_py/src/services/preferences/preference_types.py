from dataclasses import dataclass
from .. import StreamEndpoint

@dataclass
class SavedPrefrences:
    default_stream: StreamEndpoint
