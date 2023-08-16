import subprocess
import sys
from typing import List

from loguru import logger

from system_api.wifi import WifiManager


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
