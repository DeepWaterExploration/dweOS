from enum import Enum

from pydantic import BaseModel
from sdbus_async.networkmanager import (
    DeviceState,
)


class IPV4Method(Enum):
    manual = "manual"
    auto = "auto"
    unknown = "unknown"


class IPV4Address(BaseModel):
    address: str
    prefix: int


class IPV4Configuration(BaseModel):
    ip_addresses: list[IPV4Address] | None = None
    gateway: str | None = None
    method: IPV4Method = IPV4Method.unknown
    dns: list[str] | None = None
    never_default: bool | None = None


class WiredDeviceModel(BaseModel):
    interface: str
    state: DeviceState
    is_active: bool
    active_profile_id: str | None = None
    active_ip_configuration: IPV4Configuration | None = None
    available_profiles: list[str]


class ConnectionProfileModel(BaseModel):
    id: str
    path: str
    ipv4_settings: IPV4Configuration
