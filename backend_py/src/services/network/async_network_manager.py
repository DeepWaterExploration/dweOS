import asyncio
import sdbus
from sdbus_async.networkmanager import (
    NetworkManager,
    NetworkDeviceGeneric,
    DeviceState,
    DeviceType,
    DeviceCapabilities as Capabilities,
    ActiveConnection,
    NetworkDeviceWired,
    IPv4Config,
    NetworkManagerSetting,
    NetworkConnectionSettings,
    NetworkManagerSettings,
    NetworkManagerConnectionProperties
)
from enum import Enum
from event_emitter import EventEmitter
from pathlib import Path

from dataclasses import dataclass
from typing import Optional, List, Any


class IPV4Method(Enum):
    manual = "manual"
    auto = "auto"
    unknown = "unknown"


@dataclass
class IPV4Address:
    address: str
    prefix: int


@dataclass
class IPV4Configuration:
    ip_addresses: Optional[List[IPV4Address]] = None
    gateway: str = ""
    method: IPV4Method = IPV4Method.unknown
    dns: Optional[List[str]] = None


def _unpack_dbus_value(setting: NetworkManagerSetting | Any, expected_type="") -> Any:
    '''
    Recursively unpacks dbus values from a NetworkManagerSetting
    '''
    value = setting
    if isinstance(value, tuple):
        (actual_type, value) = setting

        if expected_type != "" and actual_type != expected_type:
            raise AssertionError("Setting type does not match!")

    if isinstance(value, list):
        return [_unpack_dbus_value(item) for item in value]

    if isinstance(value, dict):
        return {k: _unpack_dbus_value(v) for k, v in value.items()}

    return value


class WiredDevice(EventEmitter):
    '''
    Represents a NetworkManager wired device

    Architecture:
    This device can be either active or inactive depending on whether or not `self.connection_settings` is set to None or not.
    If it's active, it is able to control it's own active connection. Instead of this connection being represented by its own object,
    it's controlled by its owning device. That way we can control it in a way that feels familiar in a UI. A user does not care
    what connection a device is controlling, only what parameters it has, and whether or not it selects correctly. Currently, the assumption
    remains that there is only one good nmconnection, so there can only be a single ethernet device that is active at once. This is a
    relatively naive assumption, but holds true for nearly all systems.

    Tentative:
    We share this connection between all the ethernet devices and set `auto-reconnect` to False for this connection. Then we request activation
    when the state dictates it's ready for it. In testing, it appears this holds true when old_state was UNAVAILABLE and new_state is DISCONNECTED.

    Concerns:
    If this app crashes, we may permanently lose connection, since we'd now rely on it for connection. We can look into `ExecStopPost` or let NetworkManager
    handle autoconnection.
    '''

    def __init__(self, device_path: str):
        super().__init__()

        self.nm_device = NetworkDeviceWired(device_path)
        self.interface: str | None = None

        # Live state
        self.state: DeviceState = DeviceState.UNKNOWN
        # `has_active_connection` being True does not mean it has an active ip configuration yet. It takes some time after between IP_CONFIG and ACTIVATED
        # The only way to verify this will be valid is either checking if it's None or checking if the state == ACTIVATED
        self.active_ip_configuration: IPV4Configuration | None = None

        # Settings
        # Behavior:
        # When the device has an active connection associated, it will listen for settings changes
        # These settings changes as an object are stored in self.connection_settings
        # These are then also propagated as a dict stored in config, where the data is guaranteed to be live, and can be
        # synchronously accessed.
        self.connection_settings: NetworkConnectionSettings | None = None
        self.has_active_connection = False
        # The dbus config that will be updated whenever the signal is received
        self.ip_settings: IPV4Configuration | None = None

        self._settings_listener_task = None
        self.tasks = []

        self.manual_autoconnect = False

    async def initialize(self):
        # Initialized here
        self.interface = await self.nm_device.interface

        # Set the initial state
        await self._set_state(None, await self.nm_device.state)

        # Add the ip configuration listener task
        self.tasks.append(asyncio.create_task(self._listen()))

    async def set_autoreconnect(self, autoreconnect: bool):
        if not self.connection_settings:
            print("This device has no active connection!")
            return

        settings = await self.connection_settings.get_settings()

        # Not sure when this code block would be run, probably never
        if "connection" not in settings:
            settings["connection"] = {}

        # D-Bus variant
        settings["connection"]["autoconnect"] = ("b", autoreconnect)

        print(f"{'Disabling' if not autoreconnect else 'Enabling'} autoconnect for profile: {Path(await self.connection_settings.filename).name}")
        await self.connection_settings.update(settings)

    async def _listen_connection_settings(self):
        print(f"{self.interface}: Listening for changes in connection settings")
        async for _ in self.connection_settings.updated.catch():
            if self.connection_settings:
                print(f"Updating connection settings for {await self.connection_settings.filename}")
                await self._update_connection_settings()

    def get_active_settings(self) -> IPV4Configuration | None:
        if self.state != DeviceState.ACTIVATED or not self.active_ip_configuration:
            return None
        return self.active_ip_configuration

    def _deserialize_ipv4_config(self, ipv4_settings: NetworkManagerConnectionProperties) -> IPV4Configuration:
        '''
        Get the serialized settings from the active nmconnection profile.

        If no profile is active, `None` is returned
        '''
        method = _unpack_dbus_value(
            ipv4_settings.get("method", ("s", "unknown")), "s")
        raw_addresses = _unpack_dbus_value(
            ipv4_settings.get("address-data", ("aa{sv}", [])), "aa{sv}")
        dns = _unpack_dbus_value(ipv4_settings.get(
            "dns-search", ("as", [])), "as")
        gateway = _unpack_dbus_value(
            ipv4_settings.get("gateway", ("s", "")), "s")

        ip_addresses = [
            IPV4Address(address=addr['address'], prefix=addr['prefix'])
            for addr in raw_addresses
        ]

        ip_v4_config = IPV4Configuration(
            ip_addresses, gateway, IPV4Method(method), dns)

        return ip_v4_config

    async def set_ip_v4_configuration(self, configuration: IPV4Configuration):
        pass

    async def _update_ipv4_connection_profile(self):
        '''
        Determine if the device is still active. If so, start/continue utilizing the active connection. If not, delete it.
        '''

        # Path to the actual connection object
        # org.freedesktop.NetworkManager.Connection.Active
        active_connection_path = await self.nm_device.active_connection

        if active_connection_path == "/":
            if self.connection_settings:
                print(f"{self.interface}: Lost Active Connection Profile")
            self.connection_settings = None
            self.has_active_connection = False
            if self._settings_listener_task:
                self._settings_listener_task.cancel()
            return None

        active_connection = ActiveConnection(active_connection_path)
        self.connection_settings = NetworkConnectionSettings(await active_connection.connection)

        # We didn't have settings before
        if not self.has_active_connection:
            print(f"{self.interface}: Gained Active Connection Profile")
            self.has_active_connection = True

            # Update the settings immediately
            await self._update_connection_settings()

            self._settings_listener_task = asyncio.create_task(
                self._listen_connection_settings())

    async def _update_connection_settings(self):
        if not self.connection_settings:
            print(
                f"{self.interface}: Cannot update connection settings when there is no active connection")
            return

        settings_dict = await self.connection_settings.get_settings()
        self.ip_settings = self._deserialize_ipv4_config(
            settings_dict.get("ipv4"))

    async def _update_active_connection_settings(self):
        if self.state != DeviceState.ACTIVATED:
            print("Cannot update the device state of an inactive device!")
            self.active_ip_configuration = None
            return

        # Get the active ip configuration path
        config_path = await self.nm_device.ip4_config

        if config_path == "/":
            print("Error: Unable to retrive IP config despite being active.")
            return

        config = IPv4Config(config_path)

        # Initial construction
        self.active_ip_configuration = IPV4Configuration()

        # Update the active data
        address_data = _unpack_dbus_value(await config.address_data)

        self.active_ip_configuration.ip_addresses = [IPV4Address(
            address=addr["address"], prefix=addr["prefix"]) for addr in address_data]
        self.active_ip_configuration.gateway = await config.gateway
        # Maybe we can do a single unpack
        self.active_ip_configuration.dns = [data["address"] for data in _unpack_dbus_value(await config.nameserver_data)]

        print(self.ip_settings.ip_addresses)
        print(self.active_ip_configuration.ip_addresses)

    async def _set_state(self, old_state: DeviceState | None, new_state: DeviceState):
        '''
        Update the device state
        '''
        self.state = new_state

        # Yes, we can decouple this into two methods, and remove the checking if there is a connection logic, but this is 100% guaranteed to be reliable
        # and there is no tangible performance benefit for the former
        # We update the profile earlier to ensure there will never be a time when the active ip configuration is available, while the connection settings are not
        if self.state in [DeviceState.ACTIVATED, DeviceState.DEACTIVATING, DeviceState.DISCONNECTED, DeviceState.UNAVAILABLE, DeviceState.IP_CONFIG]:
            await self._update_ipv4_connection_profile()

        if self.state == DeviceState.ACTIVATED:
            # Update active data
            await self._update_active_connection_settings()
        else:
            self.active_ip_configuration = None

        if self.manual_autoconnect and self.state == DeviceState.DISCONNECTED and old_state == DeviceState.UNAVAILABLE:
            self.emit("request_activation", self)

        self.emit("state_changed", old_state, self.state)

    async def _listen(self):
        async for (
            new_state,
            old_state,
            reason,
        ) in self.nm_device.state_changed.catch():
            # TODO: catch ValueError
            print(
                f"{self.interface}: "
                f"Now {DeviceState(new_state).name}, "
                f"was {DeviceState(old_state).name}"
            )
            await self._set_state(DeviceState(old_state), DeviceState(new_state))


class AsyncNetworkManager:

    def __init__(self):
        # Get the system bus
        self.bus = sdbus.sd_bus_open_system()
        sdbus.set_default_bus(self.bus)
        self.nm = NetworkManager()
        self.nm_settings = NetworkManagerSettings()

        self.ethernet_devices: List[WiredDevice] = []

    async def _get_compatible_profiles(self, wired_device: WiredDevice) -> List[str]:
        all_paths = await self.nm_settings.connections

        # TODO: change others to this naming (profiles is a better term)
        compatible_profiles = []

        for profile_path in all_paths:
            conn_settings = NetworkConnectionSettings(profile_path)
            settings = await conn_settings.get_settings()
            connection_settings = settings.get("connection", {})

            conn_type = _unpack_dbus_value(connection_settings.get("type"))
            if conn_type != "802-3-ethernet":
                continue

            # Ensure it's not a locked connection
            interface_name = _unpack_dbus_value(
                connection_settings.get("interface-name"))
            if interface_name != None and interface_name != wired_device.interface:
                continue

            # TODO: mac filtering

            timestamp = _unpack_dbus_value(
                connection_settings.get("timestamp", ("u", 0)))

            compatible_profiles.append({
                "path": profile_path,
                "timestamp": timestamp
            })

        compatible_profiles.sort(key=lambda x: x["timestamp"], reverse=True)

        return [p["path"] for p in compatible_profiles]

    async def _get_best_connection(self, wired_device: WiredDevice) -> str | None:
        profiles = await self._get_compatible_profiles(wired_device)
        return profiles[0] if len(profiles) > 0 else None

    async def activate_ethernet_device(self, index: int):
        if index >= len(self.ethernet_devices):
            raise IndexError("Device index out of range")

        target_device = self.ethernet_devices[index]
        await self._activate_ethernet_device(target_device)

    async def _activate_ethernet_device(self, target_device: WiredDevice):
        # Check device state before anything else
        if target_device.state not in [DeviceState.DISCONNECTED, DeviceState.ACTIVATED]:
            print(f"Device {target_device.interface} cannot be activated")
            return

        best_connection = await self._get_best_connection(target_device)
        if not best_connection:
            print(
                f"Device {target_device.interface} has no available connections")
            return
        print(f"Activating device: {target_device.interface}")
        await self.nm.activate_connection(best_connection, target_device.nm_device._dbus.object_path)

    async def get_first_active_device(self) -> WiredDevice | None:
        for device in self.ethernet_devices:
            if await device.nm_device.active_connection != "/":
                return device
        return None

    async def initialize(self):
        self.all_devices = await self.nm.devices

        for device_path in self.all_devices:
            generic = NetworkDeviceGeneric(device_path)

            if await generic.capabilities & Capabilities.IS_SOFTWARE:
                continue

            interface = await generic.interface
            device_type = DeviceType(await generic.device_type)
            state = DeviceState(await generic.state)

            print(f"{interface}: {state.name}")

            if device_type == DeviceType.ETHERNET:
                eth_device = WiredDevice(device_path)
                await eth_device.initialize()
                eth_device.on("request_activation",
                              lambda dev: asyncio.create_task(self._activate_ethernet_device(dev)))
                self.ethernet_devices.append(eth_device)

            # TODO: Wireless


async def main():
    nm = AsyncNetworkManager()
    await nm.initialize()

    await asyncio.sleep(0)

    await nm.activate_ethernet_device(0)
    await asyncio.sleep(1)

    device = await nm.get_first_active_device()

    while True:
        await asyncio.sleep(1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
