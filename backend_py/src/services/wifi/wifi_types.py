from dataclasses import dataclass

@dataclass
class Connection:
    id: str
    type: str

@dataclass
class AccessPoint:
    ssid: str
    strength: int
    requires_password: bool
