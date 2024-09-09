from dataclasses import dataclass
from .light_types import LightType

@dataclass
class Light:
    intensity: int
    pin: int
    type: LightType
    nickname: str
    
