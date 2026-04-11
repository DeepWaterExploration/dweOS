from .async_network_manager import (
    AsyncNetworkManager,
    IPV4Configuration,
    IPV4Method,
    DeviceState,
)
from event_emitter import EventEmitter
from pydantic import BaseModel
from typing import Optional, List
import socketio
import time
import logging
import asyncio


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
    def __init__(self, sio: socketio.AsyncServer):
        super().__init__()

        self.logger = logging.getLogger("dwe_os_2.network.NetworkWrapper")

        self.nm = AsyncNetworkManager()
        self.sio = sio

        self.last_connection_time = time.time()

        @self.sio.on("connect")  # type: ignore
        def on_connect(sid, environ):
            self.logger.info(f"Connection detected: {sid}")
            self.last_connection_time = time.time()

        self.nm.on("profile_updated", lambda profile: self._refresh_ui())
        self.nm.on("profiles_changed", lambda: self._refresh_ui())
        self.nm.on("ip_config_changed", lambda device: self._refresh_ui())
        self.nm.on("state_changed", lambda device: self._refresh_ui())

        self._rollback_timer_task: Optional[asyncio.Task] = None

    def _refresh_ui(self):
        self.emit("refresh_ui")

    async def initialize(self):
        await self.nm.initialize()

    def get_wired_devices(self) -> List[WiredDeviceModel]:
        device_models = []
        for device in self.nm.ethernet_devices:
            device_model = WiredDeviceModel(
                interface=device.interface or "",
                state=device.state,
                active_profile_id=device.connection_profile_path,
                active_ip_configuration=device.active_ip_configuration,
                is_active=device.has_active_connection,
                available_profiles=[
                    profile.dbus_path for profile in self.nm.get_compatible_profiles(device)
                ],
            )
            device_models.append(device_model)
        return device_models

    def get_connection_profiles(self) -> List[ConnectionProfileModel]:
        connection_profiles = []
        for profile in self.nm.profiles.values():
            if not profile.ipv4_settings or not profile.id:
                continue
            profile_model = ConnectionProfileModel(
                id=profile.id, path=profile.dbus_path, ipv4_settings=profile.ipv4_settings
            )
            connection_profiles.append(profile_model)
        return connection_profiles

    async def update_connection_profile(self, path: str, ip_configuration: IPV4Configuration):
        profile = self.nm.get_profile(path)
        if profile:
            await profile.update_ipv4_configuration(ip_configuration)
            await profile.save()
            return True

        return False

    async def activate_interface(self, interface: str, profile_path: str, enable_rollback=True):
        profile = self.nm.get_profile(profile_path)
        device = self.nm.get_device_by_iface(interface)
        if not profile or not device:
            return False

        time_of_change = time.time()

        await self.nm.activate_ethernet_device(device, profile)

        if enable_rollback:
            if self._rollback_timer_task:
                self._rollback_timer_task.cancel()
            self._rollback_timer_task = asyncio.create_task(
                self._rollback_timer(interface, profile_path, time_of_change, 30)
            )

        return True

    async def _force_dhcp(self, interface: str, profile_path: str):
        safe_ip_config = IPV4Configuration(method=IPV4Method.auto, never_default=False)

        await self.update_connection_profile(profile_path, safe_ip_config)
        await self.activate_interface(interface, profile_path, False)

    async def _rollback_timer(
        self, interface: str, profile_path: str, time_of_change: float, timeout: int
    ):
        await asyncio.sleep(timeout)

        if self.last_connection_time < time_of_change:
            self.logger.error("Lockout detected! Forcing DHCP")

            await self._force_dhcp(interface, profile_path)
        else:
            self.logger.info("Active connection detected, not forcing rollback!")
