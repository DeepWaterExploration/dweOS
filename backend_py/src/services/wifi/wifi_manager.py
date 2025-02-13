from .wifi_types import *
import threading
import time
import logging
from .network_manager import NetworkManager, NMException, NMNotSupportedError
from .exceptions import WiFiException
import random
import subprocess
from ipaddress import IPv4Network

from pydantic import BaseModel

from enum import Enum

import asyncio

class NetworkPriority(str, Enum):
    AUTO = 'AUTO'
    ETHERNET = 'ETHERNET'
    WIRELESS = 'WIRELESS'

class StaticIPConfiguration(BaseModel):
    static_ip: str
    subnet_mask: str
    gateway: str
    dns: str

def netmask_to_cidr(netmask: str):
    return sum(bin(int(x)).count('1') for x in netmask.split('.'))

class WiFiManager:

    def __init__(self, scan_interval=10) -> None:
        try:
            self.nm = NetworkManager()
        except NMException:
            raise WiFiException('NetworkManager is not supported')
        
        self._update_thread = threading.Thread(target=self._update)
        self._scan_thread = threading.Thread(target=self._scan) # Secondary thread is needed to conduct scans separately
        self._is_scanning = False
        self.scan_interval = scan_interval
        self.connections = []

        self.to_forget: str | None = None
        self.to_disconnect = False
        self.to_connect: NetworkConfig | None = None

        # Changed to true after successfully completed a scan
        self.status = Status(finished_first_scan=False, connected=False)

        # get initial access points before scan
        if self.nm is not None:
            try:
                self.access_points = self.nm.get_access_points()
            except NMException as e:
                raise WiFiException(f'Error occurred while initializing access points {e}') from e
        else:
            self.access_points = []

        self.network_priority = NetworkPriority.AUTO
        self.static_ip_configuration = None

        print(self.nm.get_ip())

        # test ethernet functions
        # ethernet_interface = self.nm.set_static_ip('192.168.2.101', 24, '192.168.2.1')
        # print(f'Ethernet interface: {ethernet_interface}')
        # print(self.nm.get_ip())
        # print(f'Method: {self.nm.get_connection_method("Wired connection 1")}')

        # ethernet_has_connection = self._ping_ip('8.8.8.8', interface_name=ethernet_interface) # Ping Google's DNS server
        # print(f'Ethernet has connection: {ethernet_has_connection}')

        # # If the ethernet does not have a connection, prioritize wireless
        # if not ethernet_has_connection:
        #     self.nm.set_static_ip('192.168.2.101', 24, '192.168.2.1', prioritize_wireless=True)

        # # Ping with the default interface
        # has_connection = self._ping_ip('8.8.8.8')
        # print(f'Has connection: {has_connection}')

    def _ping_ip(self, ip: str, interface_name: str | None = None):
        '''
        Method to ping an IP address

        :param ip: The IP address to ping
        :param interface_name: The name of the interface to ping the IP address on
        :return: True if the IP address is reachable, False otherwise
        '''
        try:
            if interface_name is not None:
                subprocess.check_output(['ping', '-I', interface_name, '-c', '4', ip])
            else:
                subprocess.check_output(['ping', '-c', '4', ip])
            return True
        except subprocess.CalledProcessError:
            return False
        
    def set_network_priority(self, network_priority: NetworkPriority):
        '''
        Method to set the network priority

        :param network_priority: The network priority
        '''
        self.network_priority = network_priority

    async def set_static_ip_configuration(self, static_ip_configuration: StaticIPConfiguration):
        static_ip = static_ip_configuration.static_ip
        subnet_mask = static_ip_configuration.subnet_mask
        gateway = static_ip_configuration.gateway
        dns = static_ip_configuration.dns

        ethernet_interface = self.nm.set_static_ip(static_ip, netmask_to_cidr(subnet_mask), gateway, [dns], prioritize_wireless=self.network_priority == NetworkPriority.WIRELESS)

        # If automatic networking priority
        print(self.network_priority)
        if self.network_priority == NetworkPriority.AUTO:
            ethernet_has_connection = self._ping_ip('8.8.8.8', interface_name=ethernet_interface) # Ping Google's DNS server

            # Always default to WiFi if ethernet has no connection
            if not ethernet_has_connection:
                self.nm.set_static_ip(static_ip, netmask_to_cidr(subnet_mask), gateway, [dns], prioritize_wireless=True)


    def get_ethernet_ip(self):
        # get ethernet ip
        return self.nm.get_ip()

    def connect(self, ssid: str, password = ''):
        self.to_connect = NetworkConfig(ssid, password)

    def disconnect(self):
        self.to_disconnect = True

    def start_scanning(self):
        if self.nm is None:
            return
        logging.info('Starting WiFi Manager...')
        self._is_scanning = True
        self._update_thread.start()
        self._scan_thread.start()

    def stop_scanning(self):
        if self.nm is None:
            return
        self._is_scanning = False
        self._update_thread.join()
        self._scan_thread.join()

    def get_access_points(self):
        return self.access_points

    def get_status(self):
        return self.status

    def list_connections(self):
        return self.connections

    def forget(self, ssid: str):
        self.to_forget = ssid

    def _forget(self):
        if self.nm is None:
            return
        if self.to_forget is not None:
            self.nm.forget(self.to_forget)
        self.to_forget = None

    def _connect(self):
        if self.nm is None:
            return
        if self.to_connect is not None:
            logging.info(f'Connecting to network: {self.to_connect.ssid}')
            try:
                self.nm.connect(self.to_connect.ssid, self.to_connect.password)
            except Exception:
                logging.error(f'Failed to connect to network: {self.to_connect.ssid}')
            self.to_connect = None
        else:
            logging.warning('Attempting to connect to network of value None.')

    def _disconnect(self):
        if self.nm is None:
            return
        logging.info('Disconnecting from network')
        try:
            self.nm.disconnect()
        except NMException:
            # ignore exception
            logging.error('Failed to disconnect from network')
        self.to_disconnect = False

    def _scan(self):
        start_time = time.time()
        while self._is_scanning:
            current_time = time.time()
            elapsed_time = current_time - start_time

            # this is used so the server does not hang on close
            if elapsed_time >= self.scan_interval:
                # Make sure the scan stops when we are no longer scanning
                try:
                    self.access_points = self.nm.scan_wifi(lambda: self._is_scanning)
                    self.status.finished_first_scan = True
                except NMException as e:
                    logging.error(f'Error occurred while scanning: {e}.')

                # reset the counter
                start_time = current_time

            # No reason to check too often
            time.sleep(0.1)

    def _update_connections(self):
        if self.nm is None:
            return
        try:
            self.connections = self.nm.list_wireless_connections()
        except NMException as e:
            logging.error(f'Error occured while fetching cached connections: f{e}')

    def _update_active_connection(self):
        if self.nm is None:
            return
        try:
            connection = self.nm.get_active_wireless_connection()
            if connection is not None:
                self.status.connection = connection
                self.status.connected = True
            else:
                self.status.connection = Connection()
                self.status.connected = False
        except NMException as e:
            logging.error(f'Error occured while fetching active connection: f{e}')

    def _update(self):
        while self._is_scanning:
            # Queue requests to the network manager to avoid issues

            self._update_connections()
            self._update_active_connection()

            try:
                if not self.to_forget is None:
                    self._forget()

                if not self.to_connect is None:
                    self._connect()

                if self.to_disconnect:
                    self._disconnect()
            except NMException as e:
                logging.error(f'Error occurred while updating network information: {str(e)}')
                self.to_forget = None
                self.to_disconnect = False
                self.to_connect = None

            # No reason to check too often
            time.sleep(0.1)
