import asyncio
import logging
import socket
import struct
from typing import Any

import sdbus
from event_emitter import EventEmitter
from sdbus.utils.inspect import inspect_dbus_path
from sdbus_async.networkmanager import (
    ActiveConnection,
    DeviceState,
    DeviceType,
    IPv4Config,
    NetworkConnectionSettings,
    NetworkDeviceGeneric,
    NetworkDeviceWired,
    NetworkManager,
    NetworkManagerConnectionProperties,
    NetworkManagerSetting,
    NetworkManagerSettings,
)
from sdbus_async.networkmanager import (
    DeviceCapabilities as Capabilities,
)

from backend_py.src.models import IPV4Address, IPV4Configuration, IPV4Method

# ip to integer and reverse: https://stackoverflow.com/a/13294427


def _ip_to_integer(addr: str) -> int:
    return struct.unpack("<I", socket.inet_aton(addr))[0]


def _integer_to_ip(addr: int) -> str:
    return socket.inet_ntoa(struct.pack("<I", addr))


def _unpack_dbus_value(setting: NetworkManagerSetting | Any, expected_type="") -> Any:
    """
    Recursively unpacks dbus values from a NetworkManagerSetting
    """
    value = setting
    if isinstance(value, tuple):
        if len(value) == 2 and isinstance(value[0], str):
            (actual_type, value) = setting

            if expected_type != "" and actual_type != expected_type:
                raise AssertionError("Setting type does not match!")
        else:
            return tuple(_unpack_dbus_value(item) for item in value)

    if isinstance(value, list):
        return [_unpack_dbus_value(item) for item in value]

    if isinstance(value, dict):
        return {k: _unpack_dbus_value(v) for k, v in value.items()}

    return value


def _deserialize_ipv4_config(ipv4_settings: dict) -> IPV4Configuration:
    """
    Get the serialized settings from the active nmconnection profile.

    If no profile is active, `None` is returned
    """
    method = ipv4_settings.get("method", "unknown")
    raw_addresses = _unpack_dbus_value(
        ipv4_settings.get("address-data", ("aa{sv}", [])), "aa{sv}"
    )
    dns_servers = _unpack_dbus_value(ipv4_settings.get("dns", ("au", [])), "au")
    gateway = _unpack_dbus_value(ipv4_settings.get("gateway", ("s", "")), "s")
    never_default = _unpack_dbus_value(
        ipv4_settings.get("never-default", ("b", None)), "b"
    )

    ip_addresses = [
        IPV4Address(address=addr["address"], prefix=addr["prefix"])
        for addr in raw_addresses
    ]

    # If it's an unsupported method (link-local)
    try:
        ip_v4_method = IPV4Method(method)
    except ValueError:
        ip_v4_method = IPV4Method.unknown

    ip_v4_config = IPV4Configuration(
        ip_addresses=ip_addresses,
        gateway=gateway,
        method=ip_v4_method,
        dns=[_integer_to_ip(dns) for dns in dns_servers],
        never_default=never_default,
    )

    return ip_v4_config


def _serialize_ipv4_config(
    ipv4_configuration: IPV4Configuration,
) -> dict:
    serialized_ip_config: dict = {
        "method": (
            "s",
            "auto" if ipv4_configuration.method == IPV4Method.auto else "manual",
        )
    }

    if (
        ipv4_configuration.method == IPV4Method.manual
        and ipv4_configuration.ip_addresses
    ):
        addr_data = []
        for addr in ipv4_configuration.ip_addresses:
            addr_data.append(
                {"address": ("s", addr.address), "prefix": ("u", addr.prefix)}
            )

        serialized_ip_config["address-data"] = ("aa{sv}", addr_data)

        if ipv4_configuration.gateway:
            serialized_ip_config["gateway"] = ("s", ipv4_configuration.gateway)

        if ipv4_configuration is not None:
            serialized_ip_config["never-default"] = (
                "b",
                ipv4_configuration.never_default,
            )

    if ipv4_configuration.dns:
        serialized_ip_config["dns"] = (
            "au",
            [_ip_to_integer(dns) for dns in ipv4_configuration.dns],
        )

    return serialized_ip_config


class ConnectionProfile(EventEmitter):
    def __init__(self, dbus_path: str) -> None:
        super().__init__()

        self.logger = logging.getLogger("dwe_os_2.network.ConnectionProfile")

        self.settings: NetworkConnectionSettings = NetworkConnectionSettings(dbus_path)
        self.dbus_path = dbus_path

        # https://networkmanager.dev/docs/api/latest/nm-settings-nmcli.html
        self.settings_dict = {}

        # deserialized params
        self.id: str | None = None

        self.ipv4_settings: IPV4Configuration | None = None

        self._on_update_task: asyncio.Task = asyncio.create_task(
            self._on_update_listener()
        )

    def delete(self) -> None:
        if self._on_update_task:
            self._on_update_task.cancel()

    async def _update_configuration(
        self, new_configuration: NetworkManagerConnectionProperties
    ) -> None:
        await self.settings.update(new_configuration)

    async def update_ipv4_configuration(
        self, new_configuration: IPV4Configuration
    ) -> None:
        old_settings: dict = await self.settings.get_settings()
        old_settings["ipv4"] = _serialize_ipv4_config(new_configuration)
        await self.settings.update_unsaved(old_settings)

    async def save(self) -> None:
        await self.settings.save()

    async def initialize(self) -> None:
        await self._update_settings()

    async def _on_update_listener(self) -> None:
        async for _ in self.settings.updated.catch():
            if self.settings:
                self.logger.debug(
                    f"Updating connection settings for {await self.settings.filename}"
                )
                await self._update_settings()

    async def _update_settings(self) -> None:
        self.emit("settings_updated")

        if not self.settings:
            self.logger.warning(
                "Cannot update connection settings when there is no active connection"
            )
            return

        self.settings_dict = _unpack_dbus_value(await self.settings.get_settings())

        self.ipv4_settings = _deserialize_ipv4_config(
            self.settings_dict.get("ipv4", {})
        )

        self.id = self.settings_dict["connection"]["id"]


class WiredDevice(EventEmitter):
    """
    Represents a NetworkManager wired device
    """

    def __init__(self, device_path: str) -> None:
        super().__init__()

        self.logger = logging.getLogger("dwe_os_2.network.WiredDevice")

        self.nm_device = NetworkDeviceWired(device_path)
        self.interface: str | None = None

        # Live state
        self.state: DeviceState = DeviceState.UNKNOWN
        # `has_active_connection` being True does not mean it has an active ip
        # configuration yet. It takes some time after between IP_CONFIG and ACTIVATED
        # The only way to verify this will be valid is either checking if it's None or
        # checking if the state == ACTIVATED
        self.active_ip_configuration: IPV4Configuration | None = None

        # Settings
        self.active_profile_path = "/"
        self.connection_profile_path = "/"
        self.active_connection: ActiveConnection | None = None
        self.connection_id = ""
        self.has_active_connection = False

        self._settings_listener_task = None
        self.tasks = []
        self._ip4_watch: asyncio.Task | None = None

        self.manual_autoconnect = False

    async def initialize(self) -> None:
        # Initialized here
        self.interface = await self.nm_device.interface

        # Set the initial state
        # (dbus returns uint32; coerce to DeviceState like _listen does)
        await self._set_state(None, DeviceState(await self.nm_device.state))

        # Add the ip configuration listener task
        self.tasks.append(asyncio.create_task(self._listen()))

    def get_active_settings(self) -> IPV4Configuration | None:
        if self.state != DeviceState.ACTIVATED or not self.active_ip_configuration:
            return None
        return self.active_ip_configuration

    def get_dbus_path(self) -> str:
        return inspect_dbus_path(self.nm_device)

    def is_available(self) -> bool:
        return self.state in [DeviceState.DISCONNECTED, DeviceState.ACTIVATED]

    async def _update_ipv4_connection_profile(self) -> None:
        """
        Determine if the device is still active.
        If so, start/continue utilizing the active connection. If not, delete it.
        """

        # Path to the actual connection object
        # org.freedesktop.NetworkManager.Connection.Active
        active_connection_path = await self.nm_device.active_connection

        if active_connection_path == "/":
            if self.has_active_connection:
                self.logger.info(f"{self.interface}: Lost active connection profile")
            self.has_active_connection = False
            self.connection_profile_path = "/"
            self.active_profile_path = "/"
            return

        if not self.has_active_connection:
            self.logger.info(f"{self.interface}: Gained active connection profile")
            self.has_active_connection = True

        self.active_profile_path = active_connection_path

        self.connection_profile_path = await ActiveConnection(
            active_connection_path
        ).connection

    async def _update_active_connection_settings(self) -> None:
        config_path = await self.nm_device.ip4_config
        if config_path == "/":
            return
        await self._read_ip4(config_path)

        # When it's activated, we start a task to check if the current configuration
        # path is updated. Then we update it. This only happens in the rare case
        # that the addresses are emitted after activation.
        if self._ip4_watch:
            self._ip4_watch.cancel()
        self._ip4_watch = asyncio.create_task(self._watch_ip4(config_path))

    async def _watch_ip4(self, config_path: str) -> None:
        config = IPv4Config(config_path)
        async for _i, changed, _inv in config.properties_changed.catch():
            if self.state != DeviceState.ACTIVATED:
                return
            self.logger.info(f"IPv4Changed: {changed.keys()}")
            if changed.keys():
                await self._read_ip4(config_path)

    async def _read_ip4(self, config_path: str) -> None:
        config = IPv4Config(config_path)
        cfg = IPV4Configuration()
        cfg.ip_addresses = [
            IPV4Address(address=a["address"], prefix=a["prefix"])
            for a in _unpack_dbus_value(await config.address_data)
        ]
        cfg.gateway = await config.gateway
        cfg.dns = [
            d["address"] for d in _unpack_dbus_value(await config.nameserver_data)
        ]
        self.active_ip_configuration = cfg
        self.emit("ip_config_changed")

    async def _set_state(
        self, old_state: DeviceState | None, new_state: DeviceState
    ) -> None:
        """
        Update the device state
        """
        self.state = new_state

        new_interface_name = await self.nm_device.interface
        if new_interface_name != self.interface:
            self.logger.info(
                f"Interface name changed: {self.interface} -> {new_interface_name}"
            )
            self.interface = new_interface_name

        # Yes, we can decouple this into two methods, and remove the checking
        # if there is a connection logic, but this is 100% guaranteed to be reliable
        # and there is no tangible performance benefit for the former.
        # We update the profile earlier to ensure there will never be a time when the
        # active ip configuration is available, while the connection settings are not
        if self.state in [
            DeviceState.ACTIVATED,
            DeviceState.DEACTIVATING,
            DeviceState.DISCONNECTED,
            DeviceState.UNAVAILABLE,
            DeviceState.IP_CONFIG,
        ]:
            await self._update_ipv4_connection_profile()

        if self.state == DeviceState.ACTIVATED:
            # Update active data
            await self._update_active_connection_settings()
        else:
            self.active_ip_configuration = None
            if self._ip4_watch:
                self._ip4_watch.cancel()

        if (
            self.manual_autoconnect
            and self.state == DeviceState.DISCONNECTED
            and old_state == DeviceState.UNAVAILABLE
        ):
            self.emit("request_activation", self)

        self.emit("state_changed", old_state, self.state)

    async def _listen(self) -> None:
        async for (
            new_state,
            old_state,
            _reason,
        ) in self.nm_device.state_changed.catch():
            self.logger.info(
                f"{self.interface}: "
                f"Now {DeviceState(new_state).name}, "
                f"was {DeviceState(old_state).name}"
            )
            await self._set_state(DeviceState(old_state), DeviceState(new_state))


class AsyncNetworkManager(EventEmitter):
    def __init__(self) -> None:
        super().__init__()

        self.logger = logging.getLogger("dwe_os_2.network.AsyncNetworkManager")

        # Get the system bus
        self.bus = sdbus.sd_bus_open_system()
        sdbus.set_default_bus(self.bus)
        self.nm = NetworkManager()
        self.nm_settings = NetworkManagerSettings()

        self.ethernet_devices: list[WiredDevice] = []

        # dbus path: ConnectionProfile
        self.profiles: dict[str, ConnectionProfile] = {}

        self._profiles_updated_task: asyncio.Task | None = None
        self._devices_updated_task: asyncio.Task | None = None

    async def _update_profiles(self) -> None:
        all_paths = await self.nm_settings.connections
        self.profiles = {}
        for path in all_paths:
            profile = ConnectionProfile(path)
            profile.on(
                "settings_updated",
                lambda profile=profile: self.emit("profile_updated", profile),
            )
            await profile.initialize()
            self.profiles[path] = profile

    def get_device_by_iface(self, iface_name: str) -> WiredDevice | None:
        """
        Get a device by an interface name (e.g. eth0)
        """
        for device in self.ethernet_devices:
            if device.interface == iface_name:
                return device
        return None

    def get_compatible_profiles(
        self, wired_device: WiredDevice
    ) -> list[ConnectionProfile]:
        """
        Get a list of compatible profiles for a given wired device
        """
        compatible_profiles: list[tuple[ConnectionProfile, int]] = []

        for profile in self.profiles.values():
            settings = profile.settings_dict

            connection_settings = settings.get("connection", {})
            conn_type = connection_settings.get("type", "")
            if conn_type != "802-3-ethernet":
                continue

            # Ensure it's not a locked down connection
            interface_name = connection_settings.get("interface-name", None)
            if interface_name is not None and interface_name != wired_device.interface:
                continue

            # TODO: mac filtering

            timestamp: int = connection_settings.get("timestamp", 0)

            compatible_profiles.append((profile, timestamp))

        compatible_profiles.sort(key=lambda x: x[1], reverse=True)

        return [p[0] for p in compatible_profiles]

    def get_profile(self, path: str) -> ConnectionProfile | None:
        """
        Get a connection profile by its dbus path.
        This is a nondeterministic value and is only used for indexing live profiles
        """
        return self.profiles.get(path, None)

    def get_profile_by_id(self, id: str) -> ConnectionProfile | None:
        """
        Get a connection profile by id (e.g. Wired connection 1)
        """
        for profile in self.profiles.values():
            if profile.id == id:
                return profile
        return None

    async def _get_best_connection(
        self, wired_device: WiredDevice
    ) -> ConnectionProfile | None:
        profiles = self.get_compatible_profiles(wired_device)
        return profiles[0] if len(profiles) > 0 else None

    async def activate_ethernet_device_by_index(
        self, index: int, profile: ConnectionProfile | None = None
    ) -> None:
        if index >= len(self.ethernet_devices):
            raise IndexError("Device index out of range")

        target_device = self.ethernet_devices[index]
        await self.activate_ethernet_device(target_device, profile)

    async def activate_ethernet_device(
        self, target_device: WiredDevice, profile: ConnectionProfile | None = None
    ) -> None:
        if not target_device.is_available():
            self.logger.error(
                f"Device {target_device.interface} cannot be activated "
                f"(state: {target_device.state.name})"
            )
            return

        if profile is None:
            profile = await self._get_best_connection(target_device)
            if not profile:
                self.logger.error(
                    f"Device {target_device.interface} has no available profile"
                )
                return

        self.logger.info(
            f"Activating device '{target_device.interface}' with profile '{profile.id}'"
        )
        await self.nm.activate_connection(
            profile.dbus_path, target_device.get_dbus_path()
        )

    async def get_first_active_device(self) -> WiredDevice | None:
        for device in self.ethernet_devices:
            if await device.nm_device.active_connection != "/":
                return device
        return None

    async def _listen_connection_profiles(self) -> None:
        new_conn_iter = self.nm_settings.new_connection.catch()
        rem_conn_iter = self.nm_settings.connection_removed.catch()

        async def handle_new() -> None:
            async for path in new_conn_iter:
                self.logger.info(f"New connection profile detected at {path}")

                new_profile = ConnectionProfile(path)
                await new_profile._update_settings()
                self.profiles[path] = new_profile

                self.emit("profiles_changed")

        async def handle_removed() -> None:
            async for path in rem_conn_iter:
                self.profiles[path].delete()
                del self.profiles[path]

                self.emit("profiles_changed")

        await asyncio.gather(handle_new(), handle_removed())

    async def _listen_devices_updated(self) -> None:
        async def handle_added() -> None:
            async for device_path in self.nm.device_added:
                self.logger.info(f"{device_path}: New device detected")
                await self._add_device(device_path)
                self.all_devices.append(device_path)

        async def handle_removed() -> None:
            async for device_path in self.nm.device_removed:
                self.all_devices.remove(device_path)
                self.ethernet_devices = [
                    d for d in self.ethernet_devices if d.get_dbus_path() != device_path
                ]
                self.emit("devices_changed")

        await asyncio.gather(handle_added(), handle_removed())

    async def _add_device(self, device_path) -> None:
        generic = NetworkDeviceGeneric(device_path)

        if await generic.capabilities & Capabilities.IS_SOFTWARE:
            return

        interface = await generic.interface
        device_type = DeviceType(await generic.device_type)
        state = DeviceState(await generic.state)

        self.logger.debug(f"{interface}: {state.name}")

        if device_type == DeviceType.ETHERNET:
            eth_device = WiredDevice(device_path)
            await eth_device.initialize()
            eth_device.on(
                "request_activation",
                lambda dev: asyncio.create_task(self.activate_ethernet_device(dev)),
            )
            eth_device.on(
                "ip_config_changed",
                lambda eth_device=eth_device: self.emit(
                    "ip_config_changed", eth_device
                ),
            )
            eth_device.on(
                "state_changed",
                lambda old_state, new_state, eth_device=eth_device: self.emit(
                    "state_changed", eth_device
                ),
            )
            self.ethernet_devices.append(eth_device)

    async def initialize(self) -> None:
        self.all_devices = await self.nm.devices

        await self._update_profiles()
        self._profiles_updated_task = asyncio.create_task(
            self._listen_connection_profiles()
        )

        self._devices_updated_task = asyncio.create_task(self._listen_devices_updated())

        for device_path in self.all_devices:
            await self._add_device(device_path)
