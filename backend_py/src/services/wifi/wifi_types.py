from dataclasses import dataclass

@dataclass
class NetworkConfig:
    ssid: str
    password: str = ''

@dataclass
class Connection:
    id: str
    type: str

@dataclass
class AccessPoint:
    ssid: str
    strength: int
    requires_password: bool
