from pydantic import BaseModel
from typing import Optional

class NetworkConfig(BaseModel):
    ssid: str
    password: Optional[str] = None

class Connection(BaseModel):
    id: Optional[str] = None
    type: Optional[str] = None

class Status(BaseModel):
    connection: Optional[Connection] = None
    finished_first_scan: bool
    connected: bool

class AccessPoint(BaseModel):
    ssid: str
    strength: int
    requires_password: bool
