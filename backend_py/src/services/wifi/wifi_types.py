from dataclasses import dataclass
from typing import Optional

@dataclass
class NetworkConfig:
    ssid: str
    password: str = ''

@dataclass
class Connection:
    id: Optional[str] = None
    type: Optional[str] = None

@dataclass
class Status:
    connection: Connection
    finished_first_scan: bool
    connected: bool

@dataclass
class AccessPoint:
    ssid: str
    strength: int
    requires_password: bool
