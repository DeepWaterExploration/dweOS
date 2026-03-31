from .async_network_manager import AsyncNetworkManager, IPV4Configuration, IPV4Address, IPV4Method, WiredDevice, ConnectionProfile, DeviceState
from event_emitter import EventEmitter
from pydantic import BaseModel
from typing import Optional


class WiredDeviceModel(BaseModel):
    interface: str
    state: DeviceState
    active_profile_id: Optional[str] = None
    active_ip_configuration: Optional[IPV4Configuration] = None


class ConnectionProfileModel(BaseModel):
    id: str
    ipv4_settings: IPV4Configuration


class NetworkWrapper(EventEmitter):

    def __init__(self):
        super().__init__()

        self.nm = AsyncNetworkManager()

        self.network_device: WiredDevice | None = None
        self.profile: ConnectionProfile | None = None

    async def initialize(self):
        await self.nm.initialize()

        self.network_device = self.nm.ethernet_devices[0]
        self.profile = self.nm.get_profile_by_id("Wired connection 1")

        self.network_device.on("ip_config_changed",
                               lambda: self.emit("ip_changed"))

    def get_wired_devices(self):
        device_models = []
        for device in self.nm.ethernet_devices:
            device_model = WiredDeviceModel(interface=device.interface, state=device.state,
                                            active_profile_id=device.connection_id, active_ip_configuration=device.active_ip_configuration)
            device_models.append(device_model)
        return device_models

    def get_connection_profiles(self):
        connection_profiles = []
        for profile in self.nm.profiles:
            profile_model = ConnectionProfileModel(
                id=profile.id, ipv4_settings=profile.ipv4_settings)
            connection_profiles.append(profile_model)
        return connection_profiles

    def get_ip_configuration(self):
        return self.network_device.active_ip_configuration

    async def set_ip_configuration(self, ip_configuration: IPV4Configuration):
        await self.profile.update_ipv4_configuration(ip_configuration)
        await self.nm.activate_ethernet_device(self.network_device, self.profile)
