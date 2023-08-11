import asyncio
import glob
import os
import socket
import subprocess
from pathlib import Path
from typing import List, Optional, Tuple, Union


def find_valid_interfaces() -> List[str]:
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


class WPASupplicant:
    """Represents a wrapper around wpa_supplicant, which is used to manage WiFi connections."""

    BUFFER_SIZE = 4096
    DEFAULT_TARGET: Union[Tuple[str, int], str] = (
        "localhost",
        4200,
    )  # Default target for socket communication. Either a tuple of (IP address, port) or a path to a UNIX socket.
    TIMEOUT_LIMIT = (
        10  # Timeout for socket communication and scanning for WiFi networks
    )
    SOCKET_SEND_PATH = f"/run/wpa_supplicant/{find_valid_interfaces()[0]}"  # Path to the UNIX socket used for communication with wpa_supplicant
    SOCKET_RECV_PATH = f"/tmp/wpa_ctrl_{os.getpid()}-1"  # Path to the UNIX socket used for receiving data from wpa_supplicant

    def __init__(self) -> None:
        """Initializes the WPASupplicant object."""
        self.sock: Optional[socket.socket] = None

    def __del__(self) -> None:
        """Closes the socket connection when the object is destroyed."""
        if self.sock:
            self.sock.close()

    def run(self, target: Union[Tuple[str, int], str] = DEFAULT_TARGET) -> None:
        """Does the connection and setup variables

        Arguments:
            path {[tuple/str]} -- Can be a tuple to connect (ip/port) or unix socket file
        """
        Path(self.SOCKET_RECV_PATH).mkdir(parents=True, exist_ok=True)

        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_DGRAM, 0)

        # clear path
        files = glob.glob(f"{self.SOCKET_RECV_PATH}/*")
        for file in files:
            os.remove(file)
        socket_client = f"{self.SOCKET_RECV_PATH}/wpa_supplicant_service_{os.getpid()}"

        print(f"Connecting to {self.SOCKET_SEND_PATH}")
        #
        self.sock.settimeout(10)
        # Bind the receiving socket
        self.sock.bind(socket_client)
        # Connect to the sending socket
        self.sock.connect(self.SOCKET_SEND_PATH)

        print("> PING")
        self.sock.send(b"PING")
        print("<", self.sock.recv(4096).decode().strip())


async def main() -> None:
    wpa = WPASupplicant()
    wpa.run(("localhost", 6664))


if __name__ == "__main__":
    asyncio.run(main())
