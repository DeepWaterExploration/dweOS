"""
async_network_manager.py

Acts as an asyncronous wrapper for network_manager.py, preventing blocking in the FastAPI server
Asycronizes the slow DBus calls (scanning / connecting) to separate threads, prevents freezing
"""
import asyncio
import time
from typing import Callable, List
from event_emitter import EventEmitter

from .wifi_types import IPConfiguration, Status, Connection, IPType, NetworkPriority
from .network_manager import NetworkManager
from .exceptions import WiFiException
import subprocess
from .network_manager import AccessPoint, ConnectionType
import logging

from enum import Enum


class AsyncNetworkManager(EventEmitter):

    def __init__(self, scan_interval=10):
        super().__init__()
