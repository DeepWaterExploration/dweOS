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
    finished_first_scan: bool = False
    connected: bool = False

class AccessPoint(BaseModel):
    ssid: str
    strength: int
    requires_password: bool
