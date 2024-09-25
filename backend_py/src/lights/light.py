from dataclasses import dataclass

@dataclass
class Light:
    intensity: int
    pin: int
    controller_index: int
    controller_name: str
    nickname: str
