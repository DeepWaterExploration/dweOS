from pydantic import BaseModel
from typing import Optional

class ConnectionSchema(BaseModel):
    id: str
    type: str

class StatusSchema(BaseModel):
    connection: Optional[ConnectionSchema] = None
    finished_first_scan: bool
    connected: bool

class AccessPointSchema(BaseModel):
    ssid: str
    strength: int
    requires_password: bool

class NetworkConfigSchema(BaseModel):
    ssid: str
    password: str = None
