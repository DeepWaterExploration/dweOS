import asyncio
import glob
import os
import socket
import time
from pathlib import Path
from typing import Optional, Tuple, Union

from exceptions import BusyError, NetworkAddFail, SockCommError, WPAOperationFail

class WPASupplicant:
    """Represents a wrapper around wpa_supplicant, which is used to manage WiFi connections."""
    BUFFER_SIZE = 4096 # Max buffer size for receiving data
    DEFAULT_TARGET: Union[Tuple[str, int], str] = ("localhost", 6664) # Default target for socket communication. Either a tuple of (IP address, port) or a path to a UNIX socket.

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
        self.target = target

        wpa_playground_path = "/tmp/wpa_playground"
        Path(wpa_playground_path).mkdir(parents=True, exist_ok=True)

        if isinstance(self.target, tuple):
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        else:
            self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_DGRAM)
            # clear path
            files = glob.glob(f"{wpa_playground_path}/*")
            for f in files:
                os.remove(f)
            socket_client = f"{wpa_playground_path}/wpa_supplicant_service_{os.getpid()}"
            self.sock.bind(socket_client)

        self.sock.settimeout(10)
        self.sock.connect(self.target)


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

    async def send_command_mib(self, timeout: float = 1) -> bytes:
        """Send message: MIB

        Request a list of MIB variables (dot1x, dot11). The output is a text block
            with each line in  <code>variable=value</code>  format. For example:

        """
        return await self.send_command("MIB", timeout)

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

async def main() -> None:
    wpa = WPASupplicant()
    wpa.run(("localhost", 6664))
    time.sleep(1)
    await wpa.send_command_list_networks()
    for i in range(5):
        await wpa.send_command_remove_network(i)

    await wpa.send_command_add_network()
    await wpa.send_command_set_network(0, "ssid", '"wifi_ssid"')
    await wpa.send_command_set_network(0, "psk", '"wifi_password"')
    await wpa.send_command_enable_network(0)
    await wpa.send_command_save_config()
    await wpa.send_command_reconfigure()
    while True:
        time.sleep(1)
        await wpa.send_command_ping()


if __name__ == "__main__":
    asyncio.run(main())
