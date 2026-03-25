"""
network_manager.py

Manages system network connections by communicating with system NetworkManager through DBus
Handles Wifi scanning and connection management (connect / disconnect / forget) and IP Configuration (static / dynamic) for wired/wireless interfaces
"""

import logging
import sdbus
import sdbus
from sdbus_block.networkmanager import NetworkManagerSettings, NetworkManager as NetworkManagerDBUS, ActiveConnection, NetworkDeviceGeneric, DeviceType, NetworkDeviceWired, NetworkConnectionSettings, NetworkDeviceWireless, IPv4Config, AccessPoint, ConnectionType, NetworkManagerConnectionProperties
from sdbus_block.networkmanager.exceptions import NmConnectionInvalidPropertyError
import json
from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum


class IPV4Method(Enum):
    manual = "manual"
    auto = "auto"


@dataclass
class IPV4Configuration:
    ip_addresses: Optional[List[str]]
    gateway: str
    method: IPV4Method
    dns: List[str]


class WiredDevice:
    def __init__(self, network_device: NetworkDeviceWired):
        self.network_device = network_device

        # This will need periodic updating ("PropertiesChanged")
        self.active_connection = ActiveConnection(
            network_device.active_connection)

        # org.freedesktop.NetworkManager.Settings.Connection
        self.settings = NetworkConnectionSettings(active_connection.connection)

    def set_ip_configuration(self, ip_configuration: IPV4Configuration):
        # DESIGN: ip configuration internally should only be set after receiving the signal that it has changed
        properties = self.settings.get_settings()


class NetworkManager:
    """
    Class for interfacing with NetworkManager over dbus
    """

    def __init__(self) -> None:
        self._last_scan_timestamp: int | None = None

        # Get the system bus
        self.bus = sdbus.sd_bus_open_system()
        sdbus.set_default_bus(self.bus)
        self.networkmanager = NetworkManagerDBUS()

        self.logger = logging.getLogger("dwe_os_2.wifi.NetworkManager")

        self.all_devices = {path: NetworkDeviceGeneric(
            path) for path in self.networkmanager.devices}

        self.wifi_devices = [
            NetworkDeviceWireless(path)
            for path, device in self.all_devices.items()
            if device.device_type == DeviceType.WIFI
        ]

        self.wired_devices = [
            NetworkDeviceWired(path)
            for path, device in self.all_devices.items()
            if device.device_type == DeviceType.ETHERNET
        ]

        self.wifi_enabled = True
        self.wired_enabled = True

        if len(self.wifi_devices) == 0:
            # no wifi
            self.wifi_enabled = False

        if len(self.wired_devices) == 0:
            # no ethernet
            self.wired_enabled = False

    def get_wired_interface_names(self):
        return [device.interface for device in wired_devices]


if __name__ == "__main__":
    nm = NetworkManager()

    all_devices = {path: NetworkDeviceGeneric(
        path) for path in nm.networkmanager.devices}

    wifi_devices = [
        NetworkDeviceWireless(path)
        for path, device in all_devices.items()
        if device.device_type == DeviceType.WIFI
    ]

    wired_devices = [
        NetworkDeviceWired(path)
        for path, device in all_devices.items()
        if device.device_type == DeviceType.ETHERNET
    ]

    print("Wired Device Interfaces: " +
          ", ".join([device.interface for device in wired_devices]))

    print("Wireless Device Interfaces: " +
          ", ".join([device.interface for device in wifi_devices]))

    network_manager_settings = NetworkManagerSettings()

    all_connections = [
        NetworkConnectionSettings(x) for x in network_manager_settings.connections
    ]

    print("All Connections: " +
          ", ".join([connection.filename for connection in all_connections]))

    # We want to update by ethernet device not by ID?
    # Probably by ID is preferred, but this gives us a bit more info
    for interface in wired_devices:
        if interface.active_connection == "/":
            continue
        active_connection = ActiveConnection(interface.active_connection)
        settings = NetworkConnectionSettings(active_connection.connection)
        print(
            f"Active connection settings for {interface.interface}: {Path(settings.filename).stem}")
        ip_config = IPv4Config(active_connection.ip4_config)
        print(
            f"Active connection {interface.interface}: {ip_config.address_data}")

    # The default connection we should always be using unless configured otherwise
    connections = network_manager_settings.get_connections_by_id(
        "Wired connection 1")
    if len(connections) > 0:
        connection = connections[0]
        settings = NetworkConnectionSettings(connection)
        settings.get_settings()
