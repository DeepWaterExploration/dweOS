import subprocess
import sys
from typing import List

from loguru import logger
from wifi.exceptions import BusyError
from wifi.WifiManager import WifiManager


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

    async def toggle_wifi_status(self, wifi_on: bool):
        """
        Toggles WiFi based on current state.

        Parameters:
        - wifi_on (bool): True if Wi-Fi is enabled, False otherwise.

        Returns:
        - wifi_on (bool): True if Wi-Fi is enabled, False otherwise.
        """
        try:
            cmd = f"sudo nmcli radio wifi {'on' if wifi_on else 'off'}"
            # Run the command and capture the output and errors
            subprocess.run(
                cmd,
                check=True,
                shell=True,
                capture_output=True,
                text=True,
            )
            return {"enabled": wifi_on}
        except Exception as e:
            print("Error: An unexpected error occurred.")
            print("Error message: ", str(e))
            return {"Enabled": False}

    async def connect(self, ssid: str, password: str) -> None:
        """Connects to the specified wifi network."""
        try:
            subprocess.run(
                f'nmcli device wifi connnect "{ssid}" password "{password}"',
                check=True,
                shell=True,
                capture_output=True,
                text=True,
            )
            return {"success": True}
        # Command not found
        except Exception as error:
            logger.error(f"Error forgetting network: {error}")
            return {"success": False}

    async def connected(self):
        """Returns the connected wifi network."""
        try:
            connected_network = await self.wifi_manager.get_current_network()
            return connected_network
        except BusyError as error:
            logger.error(f"Error getting connected network: {error}")
            return

    async def disconnect(self, ssid: str) -> None:
        """Reconfigure wpa_supplicant
        This will force the reevaluation of the conf file
        """
        try:
            subprocess.run(
                f'nmcli device disconnect "{ssid}"',
            )
            return {"success": True}
        # Command not found
        except Exception as error:
            logger.error(f"Error disconnecting from network: {error}")
            return {"success": False}

    async def forget(self, ssid: str):
        """Forgets the specified wifi network."""
        try:
            subprocess.run(
                f'sudo nmcli connection delete "{ssid}"',
                check=True,
                shell=True,
                capture_output=True,
                text=True,
            )
            return {"success": True}
        # Command not found
        except Exception as error:
            logger.error(f"Error forgetting network: {error}")
            return {"success": False}
