import asyncio
import time

from .wifi_types import *
from .network_manager import NetworkManager, NMException
from .exceptions import WiFiException

from typing import Callable

import logging

from enum import Enum

class CommandType(str, Enum):
    CONNECT = "connect"
    DISCONNECT = "disconnect"
    FORGET = "forget"

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

class AsyncNetworkManager:

    def __init__(self, scan_interval=10):
        try:
            self.nm = NetworkManager()
        except NMException:
            raise WiFiException('NetworkManager is not supported')
        
        self._nm_lock = asyncio.Lock()

        self._command_queue: asyncio.Queue[Command] = asyncio.Queue()

        self._static_ip_configuration = IPConfiguration()

        self.scan_interval = scan_interval
        self._scanning = False
        self._scan_task = None
        self._update_task = None
        self._requested_scan = False

        self.status = Status()
        self.connections = []
        self.access_points = []

        self.nm.set_static_ip('192.168.2.101', 24, '192.168.2.1', prioritize_wireless=True)

        self._initialize_access_points()
        self._initialize_static_ip()

    def _initialize_static_ip(self):
        logging.info(self.nm.get_ip_info())

    def _initialize_access_points(self):
        '''
        Initialize AP list
        '''
        try:
            self.access_points = self.nm.get_access_points()
        except NMException as e:
            raise WiFiException(f'Error occurred while initializing access points {e}') from e

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

        logging.info('WiFi manager scanning stopped')

    def get_access_points(self):
        return self.access_points

    def get_status(self):
        return self.status

    def list_connections(self):
        return self.connections

    async def connect(self, ssid: str, password: str = ''):
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
                    cmd = await asyncio.wait_for(self._command_queue.get(), timeout=0.5)
                except asyncio.TimeoutError:
                    # No command arrived, make sure we check self._scanning
                    cmd = None

                if cmd is not None:
                    await self._process_command(cmd)
                    self._command_queue.task_done()

                await self._update_connections()
                await self._update_active_connection()

                async with self._nm_lock:
                    if self._requested_scan and self.nm.has_finished_scan():
                        self.status.finished_first_scan = True
                        self._requested_scan = False
                        self.access_points = self.nm.get_access_points()

                # Only scan every 10 seconds
                if current_time - start_time > self.scan_interval:
                    start_time = current_time
                    async with self._nm_lock:
                        self.nm.request_wifi_scan()
                        self._requested_scan = True
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
        else:
            cmd.set_exception(ValueError(f"Unknown command type: {cmd.cmd_type}"))

    async def _handle_connect(self, cmd: Command, ssid: str, password: str = ''):
        try:
            async with self._nm_lock:
                self.nm.connect(ssid, password)
            
                if await self._wait_for(lambda: self.nm.get_active_wireless_connection().id == ssid):
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

                if await self._wait_for(lambda: self.nm.get_active_wireless_connection() is None):
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
                self.connections = self.nm.list_wireless_connections()
        except NMException as e:
            logging.error(f'Error occured while fetching cached connections: f{e}')

    async def _update_active_connection(self):
        if self.nm is None:
            return
        try:
            async with self._nm_lock:
                connection = self.nm.get_active_wireless_connection()
            if connection is not None:
                self.status.connection = connection
                self.status.connected = True
            else:
                self.status.connection = Connection()
                self.status.connected = False
        except NMException as e:
            logging.error(f'Error occured while fetching active connection: f{e}')
