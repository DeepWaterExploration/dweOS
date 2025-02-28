import asyncio
import time
from typing import Callable
from event_emitter import EventEmitter

from .wifi_types import IPConfiguration, Status, Connection, IPType, NetworkPriority
from .network_manager import NetworkManager, NMException
from .exceptions import WiFiException
import subprocess

import logging

from enum import Enum


class CommandType(str, Enum):
    CONNECT = "connect"
    DISCONNECT = "disconnect"
    FORGET = "forget"
    UPDATE_IP = "update_ip"
    CHANGE_NETWORK_PRIORITY = "priority"


class Command:
    def __init__(self, cmd_type: CommandType, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs
        self.cmd_type = cmd_type

        self.future = asyncio.get_running_loop().create_future()

    def set_result(self, result=None):
        if not self.future.done():
            self.future.set_result(result)

    def set_exception(self, exc: Exception):
        if not self.future.done():
            self.future.set_exception(exc)


class AsyncNetworkManager(EventEmitter):

    def __init__(self, scan_interval=10):
        super().__init__()
        try:
            self.nm = NetworkManager()
        except NMException:
            raise WiFiException("NetworkManager is not supported")

        self._nm_lock = asyncio.Lock()

        self._command_queue: asyncio.Queue[Command] = asyncio.Queue()

        self._ip_configuration = IPConfiguration()
        self._network_priority = NetworkPriority.ETHERNET

        self.scan_interval = scan_interval
        self._scanning = False
        self._scan_task = None
        self._update_task = None
        self._requested_scan = False

        self.status = Status()
        self.connections = []
        self.access_points = []

        # self.nm.set_static_ip("192.168.2.101", 24, prioritize_wireless=True)
        # self.nm.set_dynamic_ip(prioritize_wireless=True)

        self._initialize_access_points()
        self._initialize_ip_configuration()

    def get_network_priority(self):
        return self._network_priority

    def _ping_ip(self, ip: str, interface_name: str | None = None):
        """
        Method to ping an IP address

        :param ip: The IP address to ping
        :param interface_name: The name of the interface to ping the IP address on
        :return: True if the IP address is reachable, False otherwise
        """
        try:
            if interface_name is not None:
                subprocess.check_output(["ping", "-I", interface_name, "-c", "4", ip])
            else:
                subprocess.check_output(["ping", "-c", "4", ip])
            return True
        except subprocess.CalledProcessError:
            return False

    def _initialize_ip_configuration(self):
        self._ip_configuration = self.nm.get_ip_info()

        if self._ip_configuration == None:
            logging.info("No ethernet connection detected")
        elif self._ip_configuration.ip_type == IPType.STATIC:
            logging.info(
                f"Static IP: {self._ip_configuration.static_ip}/{self._ip_configuration.prefix}, Gateway: {self._ip_configuration.gateway}"
            )
        else:
            logging.info(
                f"Dynamic IP: {self._ip_configuration.static_ip}/{self._ip_configuration.prefix}"
            )

    def _initialize_access_points(self):
        """
        Initialize AP list
        """
        try:
            self.access_points = self.nm.get_access_points()
        except NMException as e:
            raise WiFiException(
                f"Error occurred while initializing access points {e}"
            ) from e

    def get_ip_configuration(self):
        return self._ip_configuration

    def start_scanning(self):
        self._scanning = True
        self._update_task = asyncio.create_task(self._update_loop())

        logging.info("WiFi manager scanning started")

    async def stop_scanning(self):
        self._scanning = False

        if self._scan_task:
            await self._scan_task
        if self._update_task:
            await self._update_task

        logging.info("WiFi manager scanning stopped")

    def get_access_points(self):
        return self.access_points

    def get_status(self):
        return self.status

    def list_connections(self):
        return self.connections

    async def set_network_priority(self, network_priority: NetworkPriority):
        self._network_priority = network_priority
        cmd = Command(CommandType.CHANGE_NETWORK_PRIORITY, network_priority)
        await self._command_queue.put(cmd)
        return await cmd.future

    async def set_ip_configuration(self, ip_configuration: IPConfiguration):
        cmd = Command(CommandType.UPDATE_IP, ip_configuration)
        await self._command_queue.put(cmd)
        return await cmd.future

    async def connect(self, ssid: str, password: str = ""):
        cmd = Command(CommandType.CONNECT, ssid, password)
        await self._command_queue.put(cmd)
        return await cmd.future

    async def disconnect(self):
        cmd = Command(CommandType.DISCONNECT)
        await self._command_queue.put(cmd)
        return await cmd.future

    async def forget(self, ssid: str):
        cmd = Command(CommandType.FORGET, ssid)
        await self._command_queue.put(cmd)
        return await cmd.future

    async def _update_loop(self):
        start_time = time.time()
        while self._scanning:
            try:
                current_time = time.time()
                try:
                    cmd = await asyncio.wait_for(self._command_queue.get(), timeout=0.1)
                except asyncio.TimeoutError:
                    # No command arrived, make sure we check self._scanning
                    cmd = None

                if cmd is not None:
                    await self._process_command(cmd)
                    self._command_queue.task_done()

                await self._update_connections()
                await self._update_active_connection()

                async with self._nm_lock:
                    # Update ip configuration
                    new_ip_configuration = self.nm.get_ip_info()
                    if new_ip_configuration != self._ip_configuration:
                        self._ip_configuration = new_ip_configuration
                        logging.info("IP Configuration changed")
                        self.emit("ip_changed")

                async with self._nm_lock:
                    if self._requested_scan and self.nm.has_finished_scan():
                        self.status.finished_first_scan = True
                        self._requested_scan = False
                        new_access_points = self.nm.get_access_points()
                        # Can't just do this
                        # if new_access_points != self.access_points:
                        #     self.emit("aps_changed")

                        # do this:
                        current_ssids = {ap.ssid for ap in self.access_points}
                        new_ssids = {ap.ssid for ap in new_access_points}

                        if new_ssids - current_ssids != set():
                            self.emit("aps_changed")

                        self.access_points = new_access_points

                # Only scan every 10 seconds
                if current_time - start_time > self.scan_interval:
                    start_time = current_time
                    async with self._nm_lock:
                        self.nm.request_wifi_scan()
                        self._requested_scan = True

                await asyncio.sleep(5)
            except Exception as e:
                logging.exception("Exception in _update_loop: %s", e)

    async def _process_command(self, cmd: Command):
        if cmd.cmd_type == CommandType.CONNECT:
            ssid, password = cmd.args
            await self._handle_connect(cmd, ssid, password)
        elif cmd.cmd_type == CommandType.DISCONNECT:
            await self._handle_disconnect(cmd)
        elif cmd.cmd_type == CommandType.FORGET:
            (ssid,) = cmd.args
            await self._handle_forget(cmd, ssid)
        elif cmd.cmd_type == CommandType.UPDATE_IP:
            (ip_configuration,) = cmd.args
            await self._handle_update_ip(cmd, ip_configuration)
        elif cmd.cmd_type == CommandType.CHANGE_NETWORK_PRIORITY:
            (network_priority,) = cmd.args
            await self._handle_change_network_priority(cmd, network_priority)
        else:
            cmd.set_exception(ValueError(f"Unknown command type: {cmd.cmd_type}"))

    def _set_static_ip(
        self, ip_configuration: IPConfiguration, prioritize_wireless=False
    ):
        """do not call"""
        return self.nm.set_static_ip(
            ip_configuration.static_ip,
            ip_configuration.prefix,
            ip_configuration.gateway or "0.0.0.0",
            ip_configuration.dns,
            prioritize_wireless=prioritize_wireless,
        )

    async def _handle_change_network_priority(
        self, cmd: Command, network_priority: NetworkPriority
    ):
        async with self._nm_lock:
            if self._ip_configuration is None:
                return
            if network_priority == NetworkPriority.ETHERNET:
                self._set_static_ip(self._ip_configuration)
                cmd.set_result(True)
            else:  # Wireless Priority
                self._set_static_ip(self._ip_configuration, True)
                cmd.set_result(True)

    async def _handle_update_ip(self, cmd: Command, ip_configuration: IPConfiguration):
        try:
            async with self._nm_lock:
                if ip_configuration.ip_type == IPType.STATIC:
                    self._set_static_ip(ip_configuration)
                    cmd.set_result(True)
                else:
                    self.nm.set_dynamic_ip()
                    cmd.set_result(True)
        except Exception as e:
            cmd.set_exception(e)

    async def _handle_connect(self, cmd: Command, ssid: str, password: str = ""):
        try:
            async with self._nm_lock:
                self.nm.connect(ssid, password)

                if await self._wait_for(
                    lambda: self.nm.get_active_wireless_connection().id == ssid
                ):
                    self.status.connected = False
                    self.status.connection = None
                    cmd.set_result(True)
                else:
                    cmd.set_result(False)
        except Exception as e:
            cmd.set_exception(e)

    async def _handle_disconnect(self, cmd: Command):
        try:
            async with self._nm_lock:
                self.nm.disconnect()

                if await self._wait_for(
                    lambda: self.nm.get_active_wireless_connection() is None
                ):
                    self.status.connected = False
                    self.status.connection = None
                    cmd.set_result(True)
                else:
                    cmd.set_result(False)

        except Exception as e:
            cmd.set_exception(e)

    async def _handle_forget(self, cmd: Command, ssid: str):
        try:
            async with self._nm_lock:
                self.nm.forget(ssid)

            cmd.set_result(True)

        except Exception as e:
            cmd.set_exception(e)

    async def _wait_for(self, generator: Callable[[], bool], timeout=10):
        for _ in range(timeout):
            if generator():
                return True
            await asyncio.sleep(1)
        return False

    async def _update_connections(self):
        if self.nm is None:
            return
        try:
            async with self._nm_lock:
                connections = self.nm.list_wireless_connections()
                if connections != self.connections:
                    self.emit("connections_changed")
                    self.connections = connections
        except NMException as e:
            logging.error(f"Error occured while fetching cached connections: f{e}")

    async def _update_active_connection(self):
        if self.nm is None:
            return
        try:
            async with self._nm_lock:
                connection = self.nm.get_active_wireless_connection()
                if connection is not None:
                    if (
                        self.status.connection != connection
                        and not self.status.connected
                    ):
                        self.status.connection = connection
                        self.status.connected = True
                        self.emit("connected")
                    elif self.status.connected:
                        self.status.connection = connection
                        self.emit("connection_changed")
                else:
                    if self.status.connected:
                        self.emit("disconnected")
                    self.status.connection = Connection()
                    self.status.connected = False
        except NMException as e:
            # An error regarding path will occur sometimes when the connection has not re-activated
            logging.error(f"Error occured while fetching active connection: f{e}")
