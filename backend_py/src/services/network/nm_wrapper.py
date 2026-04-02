from .async_network_manager import AsyncNetworkManager, IPV4Configuration, IPV4Address, IPV4Method, WiredDevice, ConnectionProfile, DeviceState
from event_emitter import EventEmitter
from pydantic import BaseModel, Field
from typing import Optional, List


class WiredDeviceModel(BaseModel):
    interface: str
    state: DeviceState
    is_active: bool
    active_profile_id: Optional[str] = None
    active_ip_configuration: Optional[IPV4Configuration] = None
    available_profiles: List[str]


class ConnectionProfileModel(BaseModel):
    id: str
    path: str
    ipv4_settings: IPV4Configuration


class NetworkWrapper(EventEmitter):

    def __init__(self):
        super().__init__()

        self.nm = AsyncNetworkManager()

    async def initialize(self):
        await self.nm.initialize()

    def get_wired_devices(self) -> List[WiredDeviceModel]:
        device_models = []
        for device in self.nm.ethernet_devices:
            device_model = WiredDeviceModel(interface=device.interface, state=device.state,
                                            active_profile_id=device.connection_profile_path, active_ip_configuration=device.active_ip_configuration, is_active=device.has_active_connection,
                                            available_profiles=[profile.dbus_path for profile in self.nm.get_compatible_profiles(device)])
            device_models.append(device_model)
        return device_models

    def get_connection_profiles(self) -> List[ConnectionProfileModel]:
        connection_profiles = []
        for profile in self.nm.profiles.values():
            profile_model = ConnectionProfileModel(
                id=profile.id, path=profile.dbus_path, ipv4_settings=profile.ipv4_settings)
            connection_profiles.append(profile_model)
        return connection_profiles

    def update_connection_profile(self, path: str, ip_configuration: IPV4Configuration):
        profile = self.nm.get_profile(path)
        if profile:
            profile.update_ipv4_configuration(ip_configuration)
            profile.save()
