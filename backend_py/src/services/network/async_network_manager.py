import argparse
import asyncio
import sdbus
from sdbus_async.networkmanager import (
    NetworkManager,
    NetworkDeviceGeneric,
    DeviceState,
    DeviceType,
    DeviceCapabilities as Capabilities,
    ActiveConnection,
    ConnectivityState,
    NetworkDeviceWireless,
    DeviceStateReason,
    NetworkDeviceWired,
    IPv4Config,
    NetworkManagerSetting,
    NetworkConnectionSettings
)
from enum import Enum
from event_emitter import EventEmitter

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

    def __init__(self, device_path: str):
        super().__init__()

        self.nm_device = NetworkDeviceWired(device_path)

        # Live state
        self.state: DeviceState = DeviceState.UNKNOWN
        self.ip_addresses: List[IPV4Address] = []
        self.gateway: str = ""
        self.nameservers: List[str] = []

        # Configuration
        # self.method
        self.connection_settings: NetworkConnectionSettings | None = None

        self.tasks = []

        self._settings_listener_task = None

        # Listen to update the live state
        self.tasks.append(asyncio.create_task(self.listen()))
        self.tasks.append(asyncio.create_task(
            self._update_ipv4_connection_profile()))

    async def _update_ipv4_connection_profile(self):
        active_connection_path = await self.nm_device.active_connection

        if self._settings_listener_task:
            self._settings_listener_task.cancel()

        if active_connection_path == "/":
            if self.connection_settings:
                print(f"{await self.nm_device.interface}: Lost Active Connection Profile")
            self.connection_settings = None
            return None
        active_connection = ActiveConnection(active_connection_path)
        self.connection_settings = NetworkConnectionSettings(await active_connection.connection)

        self._settings_listener_task = asyncio.create_task(
            self._listen_connection_settings())

    async def _listen_connection_settings(self):
        if self.connection_settings:
            async for _ in self.connection_settings.updated.catch():
                print(await self.get_settings())

    async def get_settings(self) -> IPV4Configuration | None:
        settings = await self.connection_settings.get_settings()
        ipv4_settings = settings['ipv4']

        method = _unpack_dbus_value(
            ipv4_settings.get("method", ("s", "auto")), "s")
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

    async def listen(self):
        async for (
            new_state,
            old_state,
            reason,
        ) in self.nm_device.state_changed.catch():
            # TODO: catch ValueError
            print(
                f"{await self.nm_device.interface}: "
                f"Now {DeviceState(new_state).name}, "
                f"was {DeviceState(old_state).name}"
            )
            self.state = DeviceState(new_state)

            self.emit("state_changed", DeviceState(old_state), self.state)

            if self.state == DeviceState.ACTIVATED:
                config_path = await self.nm_device.ip4_config
                config = IPv4Config(config_path)
                address_data = _unpack_dbus_value(await config.address_data)
                self.ip_addresses = [IPV4Address(
                    address=addr["address"], prefix=addr["prefix"]) for addr in address_data]
                self.gateway = await config.gateway
                self.nameservers = [data["address"] for data in _unpack_dbus_value(await config.nameserver_data)]

            if self.state in [DeviceState.ACTIVATED, DeviceState.DEACTIVATING, DeviceState.DISCONNECTED, DeviceState.UNAVAILABLE]:
                await self._update_ipv4_connection_profile()


class AsyncNetworkManager:

    def __init__(self):
        # Get the system bus
        self.bus = sdbus.sd_bus_open_system()
        sdbus.set_default_bus(self.bus)
        self.nm = NetworkManager()

        self.ethernet_devices: List[WiredDevice] = []

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
                self.ethernet_devices.append(eth_device)

            # TODO: Wireless


async def main():
    nm = AsyncNetworkManager()
    await nm.initialize()

    while True:
        await asyncio.sleep(1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
