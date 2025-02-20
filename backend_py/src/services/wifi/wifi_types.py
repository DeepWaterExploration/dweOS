from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class NetworkPriority(str, Enum):
    AUTO = 'AUTO'
    ETHERNET = 'ETHERNET'
    WIRELESS = 'WIRELESS'

class IPType(str, Enum):
    STATIC = 'STATIC'
    DYNAMIC = 'DYNAMIC'

class IPConfiguration(BaseModel):
    static_ip: Optional[str] = ''
    gateway: Optional[str] = ''
    # CIDR prefix length
    prefix: Optional[int] = 24
    ip_type: Optional[IPType] = IPType.STATIC


class NetworkConfig(BaseModel):
    ssid: str
    password: Optional[str] = None

class Connection(BaseModel):
    id: Optional[str] = None
    type: Optional[str] = None

class Status(BaseModel):
    connection: Optional[Connection] = Field(default_factory=Connection)
    finished_first_scan: bool = False
    connected: bool = False

class AccessPoint(BaseModel):
    ssid: str
    strength: int
    requires_password: bool
