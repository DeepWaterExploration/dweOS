import asyncio
import glob
import os
import socket
import time
from pathlib import Path
from typing import List, Optional, Tuple, Union
import subprocess

from wifi.exceptions import BusyError, NetworkAddFail, SockCommError, WPAOperationFail

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
    DEFAULT_TARGET: Union[Tuple[str, int], str] = ("localhost", 4200) # Default target for socket communication. Either a tuple of (IP address, port) or a path to a UNIX socket.
    TIMEOUT_LIMIT = 10 # Timeout for socket communication and scanning for WiFi networks
    SOCKET_SEND_PATH = f"/run/wpa_supplicant/{find_valid_interfaces()[0]}" # Path to the UNIX socket used for communication with wpa_supplicant
    SOCKET_RECV_PATH = f"/tmp/wpa_ctrl_{os.getpid()}-1" # Path to the UNIX socket used for receiving data from wpa_supplicant

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
        # Bind the receiving socket
        self.sock.settimeout(10)
        # Bind the receiving socket
        self.sock.bind(socket_client)
        # Connect to the sending socket
        self.sock.connect(self.SOCKET_SEND_PATH)

    async def send_command(self, command: str, timeout: float) -> bytes:
        """Send a specific WPA Supplicant command. Raises an exception if the command fails to answer before the specified timeout.

        Arguments:
            command {str} -- WPA Supplicant command to be sent
            timeout {float} -- Maximum time (in seconds) allowed for receiving an answer before raising a BusyError
        """
        assert self.sock, "No socket assigned to WPA Supplicant"

        timeout_start = time.time()
        while time.time() - timeout_start < timeout:
            try:
                self.sock.send(command.encode("utf-8"))
                data, _ = self.sock.recvfrom(self.BUFFER_SIZE)
            except Exception as error:
                raise SockCommError("Could not communicate with WPA Supplicant socket.") from error

            if b"FAIL-BUSY" in data:
                # logger.info(f"Busy during {command} operation. Trying again...")
                await asyncio.sleep(0.1)
                continue
            break
        else:
            raise BusyError(f"{command} operation took more than specified timeout ({timeout}). Cancelling.")

        if data == b"FAIL":
            raise WPAOperationFail(f"WPA operation {command} failed.")

        return data

    async def send_command_ping(self, timeout: float = 1) -> bytes:
        """Send message: PING

        This command can be used to test whether wpa_supplicant is replying to
            the control interface commands. The expected reply is  <code>PONG</code>
            if the connection is open and wpa_supplicant is processing commands.

        """
        return await self.send_command("PING", timeout)

    async def send_command_mib(self, timeout: float = 1) -> bytes:
        """Send message: MIB

        Request a list of MIB variables (dot1x, dot11). The output is a text block
            with each line in  <code>variable=value</code>  format. For example:

        """
        return await self.send_command("MIB", timeout)

    async def send_command_reconfigure(self, timeout: float = 1) -> bytes:
        """Send message: RECONFIGURE

        Force wpa_supplicant to re-read its configuration data.
        """
        return await self.send_command("RECONFIGURE", timeout)



    async def send_command_status(self, timeout: float = 1) -> bytes:
        """Send message: STATUS

        Request current WPA/EAPOL/EAP status information. The output is a text
            block with each line in  <code>variable=value</code>  format. For
            example:
        """
        return await self.send_command("STATUS", timeout)

    async def send_command_set(self, variable: str, value: str, timeout: float = 1) -> bytes:
        """Send message: SET

        Example command:
        """
        return await self.send_command(f"SET {variable} {value}", timeout)

    async def send_command_list_networks(self, timeout: float = 1) -> bytes:
        """Send message: LIST_NETWORKS

        (note: fields are separated with tabs)
        """
        return await self.send_command("LIST_NETWORKS", timeout)

    async def send_command_disconnect(self, timeout: float = 1) -> bytes:
        """Send message: DISCONNECT

        Disconnect and wait for  <code>REASSOCIATE</code>  or  <code>RECONNECT</code>
            command before connecting.
        """
        return await self.send_command("DISCONNECT", timeout)

    async def send_command_scan(self, timeout: float = 1) -> bytes:
        """Send message: SCAN

        Request a new BSS scan.
        """
        return await self.send_command("SCAN", timeout)

    async def send_command_scan_results(self, timeout: float = 1) -> bytes:
        """Send message: SCAN_RESULTS

        (note: fields are separated with tabs)
        """
        return await self.send_command("SCAN_RESULTS", timeout)

    async def send_command_select_network(self, network_id: int, timeout: float = 1) -> bytes:
        """Send message: SELECT_NETWORK

        Select a network (disable others). Network id can be received from the
            <code>LIST_NETWORKS</code>  command output.
        """
        return await self.send_command(f"SELECT_NETWORK {network_id}", timeout)

    async def send_command_enable_network(self, network_id: int, timeout: float = 1) -> bytes:
        """Send message: ENABLE_NETWORK

        Enable a network. Network id can be received from the  <code>LIST_NETWORKS</code>
            command output. Special network id  <code>all</code>  can be used
            to enable all network.
        """
        return await self.send_command(f"ENABLE_NETWORK {network_id}", timeout)

    async def send_command_disable_network(self, network_id: int, timeout: float = 1) -> bytes:
        """Send message: DISABLE_NETWORK

        Disable a network. Network id can be received from the  <code>LIST_NETWORKS</code>
            command output. Special network id  <code>all</code>  can be used
            to disable all network.
        """
        return await self.send_command(f"DISABLE_NETWORK {network_id}", timeout)

    async def send_command_add_network(self, timeout: float = 1) -> int:
        """Send message: ADD_NETWORK

        Add a new network. This command creates a new network with empty configuration.
            The new network is disabled and once it has been configured it
            can be enabled with  <code>ENABLE_NETWORK</code>  command.  <code>ADD_NETWORK</code>
            returns the network id of the new network or FAIL on failure.

        """
        network_id = await self.send_command("ADD_NETWORK", timeout)
        if not network_id.strip().isdigit():
            raise NetworkAddFail("Add_network operation did not return a valid id.")
        return int(network_id.strip())

    async def send_command_remove_network(self, network_id: int, timeout: float = 1) -> bytes:
        """Send message: REMOVE_NETWORK

        Remove a network. Network id can be received from the  <code>LIST_NETWORKS</code>
            command output. Special network id  <code>all</code>  can be used
            to remove all network.
        """
        return await self.send_command(f"REMOVE_NETWORK {network_id}", timeout)

    async def send_command_set_network(self, network_id: int, variable: str, value: str, timeout: float = 1) -> bytes:
        """Send message: SET_NETWORK

        This command uses the same variables and data formats as the configuration
            file. See example wpa_supplicant.conf for more details.
        """
        return await self.send_command(f"SET_NETWORK {network_id} {variable} {value}", timeout)

    async def send_command_get_network(self, network_id: int, variable: str, timeout: float = 1) -> bytes:
        """Send message: GET_NETWORK

        Get network variables. Network id can be received from the  <code>LIST_NETWORKS</code>
            command output.
        """
        return await self.send_command(f"GET_NETWORK {network_id} {variable}", timeout)

    async def send_command_save_config(self, timeout: float = 1) -> bytes:
        """Send message: SAVE_CONFIG

        Save the current configuration.
        """
        return await self.send_command("SAVE_CONFIG", timeout)
