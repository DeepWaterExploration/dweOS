from dataclasses import dataclass

@dataclass
class NetworkConfig:
    ssid: str
    password: str = ''

@dataclass
class Connection:
    id: str | None = None
    type: str | None = None

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
