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

        self.nm.on("profile_updated", lambda profile: self._refresh_ui())
        self.nm.on("profiles_changed", lambda: self._refresh_ui())
        self.nm.on("ip_config_changed", lambda device: self._refresh_ui())
        self.nm.on("state_changed", lambda device: self._refresh_ui())

    def _refresh_ui(self):
        self.emit("refresh_ui")

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

    async def update_connection_profile(self, path: str, ip_configuration: IPV4Configuration):
        profile = self.nm.get_profile(path)
        if profile:
            await profile.update_ipv4_configuration(ip_configuration)
            await profile.save()
            return True

        return False

    async def activate_interface(self, interface: str, profile_path: str):
        profile = self.nm.get_profile(profile_path)
        device = self.nm.get_device_by_iface(interface)
        if profile and device:
            await self.nm.activate_ethernet_device(device, profile)
            return True
        return False
