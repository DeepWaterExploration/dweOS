"""
network_manager.py

Manages system network connections by communicating with system NetworkManager through DBus
Handles Wifi scanning and connection management (connect / disconnect / forget) and IP Configuration (static / dynamic) for wired/wireless interfaces
"""

import ipaddress
from typing import List, Dict, Any
# from .wifi_types import Connection, AccessPoint, IPConfiguration, IPType
import logging
import time
import sdbus
import sdbus
from sdbus_block.networkmanager import NetworkManagerSettings, NetworkManager as NetworkManagerDBUS, ActiveConnection, NetworkDeviceGeneric, DeviceType, NetworkDeviceWired, NetworkConnectionSettings, NetworkDeviceWireless, IPv4Config, AccessPoint, ConnectionType, NetworkManagerConnectionProperties
from sdbus_block.networkmanager.exceptions import NmConnectionInvalidPropertyError
import uuid
import subprocess


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
        # Get a local proxy to the NetworkManager object

        self.logger = logging.getLogger("dwe_os_2.wifi.NetworkManager")

    def reinit(self):
        self.bus.close()

        del self.bus
        del self.networkmanager
        time.sleep(0.1)

        # Get the system bus
        self.bus = sdbus.sd_bus_open_system()

        sdbus.set_default_bus(self.bus)
        self.networkmanager = NetworkManagerDBUS()

    def get_ip_info(self, interface_name: str | None = None) -> Dict[str, Any] | None:
        """
        Get the IP address

        :return: The IP address
        """

        # TODO: get ip of either active ethernet or wireless

        try:
            ethernet_device, connection = self._get_eth_device_and_connection()

            ethernet_device = self._get_ethernet_device(
                interface_name)
            if ethernet_device is None:
                raise Exception("No ethernet device found")

            ipv4_config = IPv4Config(
                ethernet_device.ip4_config, self.bus
            )

            addresses = ipv4_config.address_data

            # method = self.get_connection_method(connection.id)
            dns_arr = [i['address'] for i in ipv4_config.nameserver_data or []]

            if len(addresses) == 0:
                return None
            method = self.get_connection_method(connection)

            return dict(
                static_ip=addresses[0]["address"][1],
                prefix=addresses[0]["prefix"][1],
                gateway=self.get_ip_gateway(connection),
                dns=[i[1] for i in dns_arr],
                ip_type="STATIC" if method == "manual" else "DYNAMIC",
            )
        except Exception:
            return None

    def get_ipv4_settings(self, connection: ActiveConnection) -> Dict:
        return NetworkConnectionSettings(connection.connection, self.bus).get_settings().get("ipv4")

    def get_ip_gateway(self, connection: ActiveConnection):
        ipv4_settings = IPv4Config(connection.ip4_config, self.bus)
        return ipv4_settings.gateway

    def get_connection_method(self, connection: ActiveConnection) -> str:
        """
        Get the method of a connection

        :param connection_id: The ID of the connection to get the method of
        :return: The method of the connection (manual = static, auto = dynamic)
        """
        ipv4_settings = self.get_ipv4_settings(connection)
        return ipv4_settings.get("method")[1]

    def _get_eth_device_and_connection(
        self, interface_name: str | None = None, connection_id: str | None = None
    ) -> 'tuple[NetworkDeviceWired, ActiveConnection]':
        # Get the first ethernet device
        ethernet_device = self._get_ethernet_device(interface_name)
        connection = ActiveConnection(
            ethernet_device.active_connection, self.bus
        )
        return (ethernet_device, connection)

    def _update_ipv4_settings(
        self,
        settings: Dict[str, any],
        connection: ActiveConnection | None = None
    ):
        if connection is None:
            _, connection = self._get_eth_device_and_connection()
        network_settings = NetworkConnectionSettings(
            connection.connection, self.bus)

        all_connection_settings = network_settings.get_settings()
        all_connection_settings["ipv4"] = settings
        network_settings.update(all_connection_settings)
        network_settings.save()

    def set_static_ip(
        self,
        ip_address: str,
        prefix: int,
        gateway: str | None = None,
        dns_servers: List[str] = [],
        prioritize_wireless=False,
        connection: ActiveConnection | None = None,
    ):
        """
        Set the static IP address

        :param interface_name: The name of the interface to set the static IP address on
        :param ip_address: The IP address to set
        :param prefix: The CIDR prefix length of the IP address
        :param gateway: The gateway to use
        :param dns_servers: The DNS servers to use
        :param connection_id: The ID of the connection to set the static IP address on
        :return: The interface name of the ethernet device
        """

        print(
            f"Setting static IP {ip_address}/{prefix} with gateway {gateway} and DNS servers {dns_servers}")
        # Update the IPv4 configuration, leaving everything else the same
        ipv4_settings = {
            "method": ("s", "manual"),
            "address-data":
                ("aa{sv}", [{
                    "address":  ("s", ip_address),
                    "prefix":  ("u", int(prefix)),
                }]),
            "dns": ("au", [int(ipaddress.IPv4Address(dns).packed.hex(), 16) for dns in dns_servers]),
        }

        # If we prioritize wireless, there is no reason to have a default gateway, since we will always use the wireless one
        if prioritize_wireless:
            ipv4_settings["route-metric"] = ("u", 200)
            # ipv4_settings["never-default"] = True
        else:
            ipv4_settings["route-metric"] = ("u", 0)
            if gateway is not None:
                ipv4_settings["gateway"] = ("s", gateway)

        # Update the connection and return the result
        return self._update_ipv4_settings(ipv4_settings, connection=connection)

    def set_dynamic_ip(
        self,
        interface_name: str | None = None,
        prioritize_wireless=False,
        connection: ActiveConnection | None = None,
    ):
        """
        Set the dynamic IP address

        :param interface_name: The name of the interface to set the dynamic IP address on
        :param connection_id: The ID of the connection to set the dynamic IP address on
        :return: The interface name of the ethernet device
        """
        ipv4_settings = {
            "method": ("s", "auto"),
            "never-default": ("b", True),
        }

        if prioritize_wireless:
            ipv4_settings["route-metric"] = ("u", 200)
            ipv4_settings["never-default"] = ("b", True)

        return self._update_ipv4_settings(ipv4_settings, connection=connection)

    def _find_connection_by_id(self, connection_id: str) -> ActiveConnection | None:
        """
        Find a connection by its ID
        """
        for connection in self._list_connections():
            if connection.id == connection_id:
                return connection

    def _get_ethernet_device(self, interface_name: str | None = None) -> NetworkDeviceWired:
        """
        Get the path of the ethernet device with the given interface name

        :param interface_name: The name of the interface to get the ethernet device for
        :return: The path of the ethernet device
        """
        devices = self.networkmanager.get_devices()

        if not devices:
            raise Exception("No devices found")

        devs = []

        for dev_path in devices:
            device = NetworkDeviceGeneric(dev_path, self.bus)

            dev_type = device.device_type

            if dev_type == DeviceType.ETHERNET:
                devs.append(NetworkDeviceWired(
                    dev_path, self.bus
                ))

        if len(devs) == 0:
            raise Exception("No ethernet devices found")

        # If an interface name is provided, return the device with the matching interface name
        # Otherwise, return the first ethernet device found
        if interface_name:
            for device in devs:
                if device.interface == interface_name:
                    return device
        return devs[0]

    def connect(self, ssid: str, password="") -> bool:
        """
        Connects to a Wi-Fi network using the provided SSID and password.

        Args:
            ssid: The SSID (network name) of the Wi-Fi network.
            password: The password for the Wi-Fi network.

        Returns:
            True if the connection was successful, False otherwise.
        """
        wifi_device = self._get_wifi_device()

        if not wifi_device:
            return False

        # Try to find an existing connection for this SSID
        existing_connection = None
        for connection in self.networkmanager.active_connections:
            try:
                settings = NetworkConnectionSettings(
                    connection, self.bus).get_settings()
                if 'ssid' in settings.get('802-11-wireless', {}) and \
                        settings['802-11-wireless']['ssid'].decode('utf-8') == ssid:
                    existing_connection = connection
                    break
            except:
                # Device becomes out of range, turns off, etc.
                continue

        if existing_connection:
            try:
                self.networkmanager.activate_connection(
                    existing_connection, wifi_device, '/')

                return True
            except Exception as e:
                return False
        else:

            uuid_id = str(uuid.uuid4())

            connection_id = ssid

            properties: NetworkManagerConnectionProperties = {
                "connection": {
                    "id": ("s", ssid),
                    "uuid": ("s", uuid_id),
                    "type": ("s", "802-11-wireless"),
                    "autoconnect": ("b", bool(True)),
                },
                "802-11-wireless": {
                    "mode": ("s", "infrastructure"),
                    "security": ("s", "802-11-wireless-security"),
                    "ssid": ("ay", ssid.encode("utf-8")),
                },
                "802-11-wireless-security": {
                    "key-mgmt": ("s", "wpa-psk"),
                    "psk": ("s", password),
                },
                "ipv4": {"method": ("s", "auto")},
                "ipv6": {"method": ("s", "auto")},
            }
            nm_settings = NetworkManagerSettings(self.bus)
            try:
                nm_settings.add_connection(properties)
            except NmConnectionInvalidPropertyError as e:
                raise Exception(
                    "Can't Connect to wifi. Make sure password is correct")
            password_bytes = str(password + '\n')
            activate_cmd = ["nmcli", "--ask",
                            "connection", "up", connection_id]
            subprocess.run(activate_cmd, input=password_bytes,
                           capture_output=True, text=True, check=True)

    def disconnect(self):
        """
        Disconnect from any connected network
        """
        wifi_dev = self._get_wifi_device()

        if not wifi_dev:
            raise Exception("No WiFi device found")

        active_connection = ActiveConnection(
            wifi_dev.active_connection, self.bus)
        self.networkmanager.deactivate_connection(active_connection)

    def list_wireless_connections(self) -> List[ActiveConnection]:
        """
        Get a list of the active wireless connections
        """
        return self.list_connections()

    def get_active_wireless_connection(self) -> ActiveConnection | None:
        """
        Get the first active wireless connection
        """
        active_wireless_conections = list(self.get_active_connections())
        return (
            None
            if len(active_wireless_conections) == 0
            else active_wireless_conections[0]
        )

    def list_connections(self, only_wireless=True) -> List[ActiveConnection]:
        """
        Get a list of all the connections saved
        """
        connections = []
        for connection in self._list_connections():
            if (
                not only_wireless
                or connection.connection_type == ConnectionType.WIRELESS
                and connection not in connections
            ):
                connections.append(connection)
        return connections

    def get_active_connections(self, wireless_only=True) -> List[ActiveConnection]:
        """
        Get a list of active connections, including wired
        """
        active_connections = self.networkmanager.active_connections
        connections = []
        for connection_path in active_connections:
            connection = ActiveConnection(connection_path, self.bus)

            if not wireless_only or connection.connection_type == ConnectionType.WIFI:
                connections.append(
                    connection
                )

        return connections

    def get_access_points(self) -> List[AccessPoint]:
        """
        Get wifi networks without a scan
        """
        wifi_dev = self._get_wifi_device()

        if not wifi_dev:
            raise Exception("No WiFi device found")
        return self._get_access_points(wifi_dev)

    def request_wifi_scan(self) -> None:
        """
        Scan wifi networks
        """
        wifi_dev = self._get_wifi_device()

        if not wifi_dev:
            raise Exception("No WiFi device found")

        # get the timestamp of the last scan
        self._last_scan_timestamp = wifi_dev.last_scan

        # request a scan
        wifi_dev.request_scan({})

    def has_finished_scan(self):
        wifi_dev = self._get_wifi_device()

        if not wifi_dev:
            raise Exception("No WiFi device found")

        current_scan = wifi_dev.last_scan
        if current_scan != self._last_scan_timestamp:
            return True

        return False

    def forget(self, ssid: str):
        """
        Forget a network
        """
        for connection in self._list_connections():
            config = connection.GetSettings()
            # ensure config being None cannot cause issues
            if config is None:
                self.logger.warning("Failed to get config from connection")
                continue
            try:
                if config["connection"]["id"] == ssid:
                    connection.Delete()
            except KeyError as e:
                raise Exception(
                    f"Error occurred when attempting to forget network: {str(e)}"
                )

    """
    NOTE: All private functions should not have DBusException error handling
    """

    def _ap_requires_password(self, flags: int, wpa_flags: int, rsn_flags: int):
        """
        Check if a given access point requires password
        """
        NM_802_11_AP_FLAGS_PRIVACY = 0x1

        # check the overall flags and additionally check if there are any security flags which would indicate a password is needed
        return (
            flags & NM_802_11_AP_FLAGS_PRIVACY == 1 or wpa_flags != 0 or rsn_flags != 0
        )

    def _get_wifi_device(self) -> NetworkDeviceWireless | None:
        devices = self.networkmanager.get_devices()
        if devices is None:
            self.logger.warning("Failed to retrieve device list")
            devices = []
        for dev_path in devices:
            device = NetworkDeviceGeneric(dev_path, self.bus)
            dev_type = device.device_type

            # is wifi device
            if dev_type == DeviceType.WIFI:
                return NetworkDeviceWireless(dev_path, self.bus)
        return None

    def _get_access_points(self, wifi_dev: NetworkDeviceWireless) -> List[AccessPoint]:
        """
        Get a list of access points. Should only be called after scanning for networks
        """
        access_points: List[AccessPoint] = []
        wifi_access_points = wifi_dev.access_points
        if wifi_access_points is None:
            return []
        for ap_path in wifi_access_points:
            access_points.append(
                AccessPoint(ap_path, self.bus)
            )

        return sorted(access_points, key=lambda ap: ap.strength, reverse=True)

    def _list_connections(self) -> List[ActiveConnection]:
        connections = []

        # List all the connections saved
        # This might have repeats for some reason, so this needs to be filtered
        for device in self.networkmanager.get_devices():
            if device is None:
                continue
            if not isinstance(device, NetworkDeviceGeneric):
                continue
            if device.active_connection is None:
                continue

            connection = ActiveConnection(device.active_connection, self.bus)
            connections.append(connection)

        return connections

    def turn_off_wifi(self):
        """
        Turn off the WiFi device completely
        """
        wifi_dev = self._get_wifi_device()

        if not wifi_dev:
            raise Exception("No WiFi device found")

        # Alternative approach using nmcli command for more reliable wifi disabling
        try:
            subprocess.run(["nmcli", "radio", "wifi", "off"],
                           check=True, capture_output=True)
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Failed to turn off WiFi using nmcli: {e}")
            raise Exception("Failed to turn off WiFi")

    def turn_on_wifi(self):
        """
        Turn on the WiFi device
        """
        try:
            subprocess.run(["nmcli", "radio", "wifi", "on"],
                           check=True, capture_output=True)
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Failed to turn on WiFi using nmcli: {e}")
            raise Exception("Failed to turn on WiFi")

    def is_wifi_enabled(self) -> bool:
        """
        Check if WiFi is currently enabled
        """
        try:
            result = subprocess.run(
                ["nmcli", "radio", "wifi"], check=True, capture_output=True, text=True)
            return result.stdout.strip() == "enabled"
        except subprocess.CalledProcessError:
            return False
