from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class NetworkPriority(str, Enum):
    # AUTO = "AUTO"
    ETHERNET = "ETHERNET"
    WIRELESS = "WIRELESS"


class NetworkPriorityInformation(BaseModel):
    network_priority: NetworkPriority


class IPType(str, Enum):
    STATIC = "STATIC"
    DYNAMIC = "DYNAMIC"


class IPConfiguration(BaseModel):
    static_ip: Optional[str] = ""
    gateway: Optional[str] = ""
    # CIDR prefix length
    prefix: Optional[int] = 24
    ip_type: Optional[IPType] = IPType.STATIC
    dns: Optional[List[str]] = Field(default_factory=list)


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
