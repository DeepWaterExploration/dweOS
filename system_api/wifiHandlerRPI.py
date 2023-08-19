import subprocess
import sys
from typing import List

from loguru import logger
from wifi.exceptions import BusyError
import base64

from system_api.wifi.network_types import ConnectionStatus
from wifi.WifiManager import WifiManager


def base64Decode(encoded_string: str) -> int:
    """
    Returns the decoded string.

    Parameters:
    - encoded_string (str): The encoded string.

    Returns:
    - decoded_string (str): The decoded string.
    """
    # Convert the Base64 encoded string to bytes
    encoded_bytes = encoded_string.encode("utf-8")

    # Decode the bytes using Base64
    decoded_bytes = base64.b64decode(encoded_bytes)

    # Convert the decoded bytes back to a string
    decoded_string = decoded_bytes.decode("utf-8")

    return decoded_string


class WifiHandler:
    def __init__(self) -> None:
        self.wifi_manager = WifiManager()
        # Establish a socket connection with the wifi manager
        try:
            self.interface = self.find_valid_interfaces()[0]
            self.WLAN_SOCKET = f"/run/wpa_supplicant/{self.interface}"
            self.wifi_manager.connect(self.WLAN_SOCKET)
        except Exception as socket_connection_error:
            logger.warning(
                f"Error establishing wifi socket connection: {socket_connection_error}"
            )
            logger.info("Connecting via internet wifi socket.")
            try:
                self.wifi_manager.connect(("localhost", 6664))
            except Exception as udp_connection_error:
                logger.error(
                    f"Error establishing internet socket connection: {udp_connection_error}. Exiting."
                )
                sys.exit(1)
        logger.info("Socket connection established.")

    def find_valid_interfaces(self) -> List[str]:
        """Returns a list of valid network interfaces."""
        try:
            return (
                subprocess.check_output(
                    "iwconfig 2>/dev/null | grep -o '^[[:alnum:]]*'", shell=True
                )
                .decode()
                .split()
            )
        except subprocess.CalledProcessError:
            return []

    async def network_status(self):
        """Returns the status of the wifi connection."""
        wifi_status = await self.wifi_manager.status()
        return wifi_status

    async def scan(self):
        """Scans for available wifi networks."""
        try:
            available_networks = await self.wifi_manager.get_wifi_available()
            return available_networks
        except BusyError as error:
            logger.error(f"Error scanning available networks: {error}")
            return

    async def saved(self):
        """Returns the saved wifi networks."""
        saved_networks = await self.wifi_manager.get_saved_wifi_network()
        return saved_networks

    async def connect(self, ssid: str, password: str) -> None:
        """Connects to the specified wifi network."""
        try:
            available_networks = await self.wifi_manager.get_wifi_available()
            return available_networks
        except BusyError as error:
            logger.error(f"Error getting available networks: {error}")
            return

    async def toggle_wifi_status(self, wifi_on: bool):
        """
        Toggles WiFi based on current state.

        Parameters:
        - wifi_on (bool): True if Wi-Fi is enabled, False otherwise.

        Returns:
        - wifi_on (bool): True if Wi-Fi is enabled, False otherwise.
        """
        try:
            cmd = f"nmcli radio wifi {'on' if wifi_on else 'off'}"
            # Run the command and capture the output and errors
            subprocess.run(cmd, check=True)
            return {"enabled": wifi_on}
        except Exception as e:
            print("Error: An unexpected error occurred.")
            print("Error message: ", str(e))
            return {"Enabled": False}

    async def connected(self):
        """Returns the connected wifi network."""
        try:
            connected_network = await self.wifi_manager.get_current_network()
            return connected_network
        except BusyError as error:
            logger.error(f"Error getting connected network: {error}")
            return

    async def disconnect(self) -> None:
        """Reconfigure wpa_supplicant
        This will force the reevaluation of the conf file
        """
        self.connection_status = ConnectionStatus.DISCONNECTING
        try:
            # Save current network in ignored list so the watchdog doesn't auto-reconnect to it
            current_network = await self.get_current_network()
            if current_network:
                logger.debug(f"Adding '{current_network.ssid}' to ignored list.")
                self._ignored_reconnection_networks.append(current_network.ssid)
                await self.wpa.send_command_disable_network(current_network.networkid)

            await self.wpa.send_command_disconnect()
            self.connection_status = ConnectionStatus.JUST_DISCONNECTED
        except Exception as error:
            self.connection_status = ConnectionStatus.UNKNOWN
            raise ConnectionError("Failed to disconnect from wifi network.") from error

    async def forget(self, ssid: str):
        """Forgets the specified wifi network."""
        try:
            saved_networks = await self.wifi_manager.get_saved_wifi_network()
            match_networks = sorted(
                [
                    network
                    for network in saved_networks["saved_networks"]
                    if network["ssid"] == ssid
                ],
                key=lambda network: network["network_id"],
                reverse=True,
            )
            for network in match_networks:
                print(f"Removing network: {network}")
                print(f"Network ID: {network['network_id']}")
                await self.wifi_manager.remove_network(network["network_id"])
            return {"success": True}
        except Exception as error:
            logger.error(f"Error forgetting network: {error}")
            return {"success": False}
