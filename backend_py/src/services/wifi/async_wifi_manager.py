import asyncio

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

class AsyncWiFiManager:

    def __init__(self, scan_interval=10):
        try:
            self.nm = NetworkManager()
        except NMException:
            raise WiFiException('NetworkManager is not supported')
        
        self._nm_lock = asyncio.Lock()

        self._command_queue: asyncio.Queue[Command] = asyncio.Queue()

        self.scan_interval = scan_interval
        self._scanning = False
        self._scan_task = None
        self._update_task = None

        self.status = Status()
        self.connections = []
        self.access_points = []

        self._initialize_access_points()

    def _initialize_access_points(self):
        '''
        Initialize AP list
        '''
        try:
            self.access_points = self.nm.get_access_points()
        except NMException as e:
            raise WiFiException(f'Error occurred while initializing access points {e}') from e

    async def start_scanning(self):
        self._scanning = True
        self._scan_task = asyncio.create_task(self._scan_loop())
        self._update_task = asyncio.create_task(self._update_loop())

        logging.info("WiFi manager scanning started")

    async def stop_scanning(self):
        self._scanning = False

        if self._scan_task:
            await self._scan_task
        if self._update_task:
            await self._update_task

        logging.info('WiFi manager scanning stopped')

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
        while self._scanning:
            try:
                cmd = await asyncio.wait_for(self._command_queue.get(), timeout=0.5)
            except asyncio.TimeoutError:
                # No command arrived, make sure we check self._scanning
                continue

            await self._process_command(cmd)

            self._command_queue.task_done()

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
                await self.nm.connect(ssid, password)
            
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
            with self._nm_lock:
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
            with self._nm_lock:
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
