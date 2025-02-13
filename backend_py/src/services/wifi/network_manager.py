import dbus
from typing import List, Callable, Dict, Any
import time
from .wifi_types import Connection, AccessPoint
import logging
import socket
import struct

class NMException(Exception):
    '''Exception raised when there is a network manager issue'''
    pass

class NMNotSupportedError(NMException):
    '''Exception raised when NetworkManager is not supported'''
    pass

def handle_dbus_exceptions(func: Callable):
    '''
    Decorator to handle dbus exceptions, raising NMExceptions for more verbosity
    '''

    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except dbus.DBusException as e:
            raise NMException(f'DBusException occurred: {str(e)}') from e
        
    return wrapper

class NetworkManager:
    '''
    Class for interfacing with NetworkManager over dbus
    '''

    @handle_dbus_exceptions
    def __init__(self) -> None:
        # Get the system bus
        self.bus = dbus.SystemBus()
        # Get a local proxy to the NetworkManager object
        self.proxy = self.bus.get_object('org.freedesktop.NetworkManager', '/org/freedesktop/NetworkManager')

        # The proxy does not exist, since NetworkManager does not exist
        if not self.proxy:
            raise NMNotSupportedError('NetworkManager is not installed on this system.')

        # Get an interface to the NetworkManager object from the proxy
        self.interface = dbus.Interface(self.proxy, 'org.freedesktop.NetworkManager')
        # Get an interface to the properties object
        self.props = dbus.Interface(self.proxy, 'org.freedesktop.DBus.Properties')
        

    @handle_dbus_exceptions
    def get_ip(self, interface_name: str='eth0'):
        '''
        Get the IP address

        :return: The IP address
        '''

        # TODO: get ip of either active ethernet or wireless

        # This does not necessarily get the IP address of a specific nmconnection, it is just whichever the ethernet device provided is
        # TODO: Make this get the IP address of a specific nmconnection

        ethernet_device, ethernet_proxy = self._get_ethernet_device(interface_name)
        if ethernet_device is None:
            raise NMException('No ethernet device found')
        
        dev_props = dbus.Interface(ethernet_proxy, 'org.freedesktop.DBus.Properties')

        ipv4_config_path = dev_props.Get('org.freedesktop.NetworkManager.Device', 'Ip4Config')
        if not ipv4_config_path or ipv4_config_path == '/':
            raise NMException('No IPv4 configuration found')
        
        ipv4_config_proxy = self.bus.get_object('org.freedesktop.NetworkManager', ipv4_config_path)
        ipv4_config_props = dbus.Interface(ipv4_config_proxy, 'org.freedesktop.DBus.Properties')

        addresses = ipv4_config_props.Get('org.freedesktop.NetworkManager.IP4Config', 'Addresses')
        print(addresses)

        if len(addresses) == 0:
            raise NMException('Ethernet device does not have an IP')

        ip_dec = addresses[0][0]
        ip_packed = struct.pack('=L', ip_dec)
        ip_str = socket.inet_ntop(socket.AF_INET, ip_packed)

        return ip_str
    
    @handle_dbus_exceptions
    def get_connection_method(self, connection_id: str) -> str:
        '''
        Get the method of a connection

        :param connection_id: The ID of the connection to get the method of
        :return: The method of the connection (manual = static, auto = dynamic)
        '''
        connection_path = self._find_connection_by_id(connection_id)
        if not connection_path:
            raise NMException(f'Connection {connection_id} not found')

        settings_proxy = self.bus.get_object('org.freedesktop.NetworkManager', connection_path)
        settings_interface = dbus.Interface(settings_proxy, 'org.freedesktop.NetworkManager.Settings.Connection')
        config = settings_interface.GetSettings()

        ipv4_settings = config.get('ipv4', {})
        method = ipv4_settings.get('method')

        return method

    @handle_dbus_exceptions
    def update_connection(self, interface_name: str, connection_id: str, settings: Dict[str, Any], activate: bool = True):
        '''
        Update a connection

        :param interface_name: The name of the interface to update the connection on
        :param connection_id: The ID of the connection to update
        :param settings: The settings to update the connection with
        :param activate: Whether to activate the connection after updating it
        :return: The interface name of the ethernet device
        '''
        ethernet_device, ethernet_proxy = self._get_ethernet_device(interface_name)
        if ethernet_device is None:
            raise NMException('No ethernet device found')
        
        # Get the interface name of the ethernet device
        dev_props = dbus.Interface(ethernet_proxy, 'org.freedesktop.DBus.Properties')
        dev_interface = dev_props.Get('org.freedesktop.NetworkManager.Device', 'Interface')

        existing_conn_path = self._find_connection_by_id(connection_id)
        settings_proxy = self.bus.get_object('org.freedesktop.NetworkManager', '/org/freedesktop/NetworkManager/Settings')
        settings_interface = dbus.Interface(settings_proxy, 'org.freedesktop.NetworkManager.Settings')

        if existing_conn_path:
            existing_conn_proxy = self.bus.get_object('org.freedesktop.NetworkManager', existing_conn_path)
            existing_conn_iface = dbus.Interface(existing_conn_proxy, 'org.freedesktop.NetworkManager.Settings.Connection')
            existing_conn_iface.Update(settings)
        else:
            # TODO: Add a new connection
            raise NMException('No existing connection found')
        
        if activate:
            self.interface.ActivateConnection(existing_conn_path, ethernet_proxy, ethernet_device)

        return dev_interface

    @handle_dbus_exceptions
    def set_static_ip(self, ip_address: str, prefix: int, gateway: str, dns_servers: List[str] = [], interface_name: str = 'enp3s0', prioritize_wireless=False, connection_id: str = 'Wired connection 1'):
        '''
        Set the static IP address

        :param interface_name: The name of the interface to set the static IP address on
        :param ip_address: The IP address to set
        :param prefix: The CIDR prefix length of the IP address
        :param gateway: The gateway to use
        :param dns_servers: The DNS servers to use
        :param connection_id: The ID of the connection to set the static IP address on
        :return: The interface name of the ethernet device
        '''
        
        logging.info(f'Setting static IP address {ip_address}/{prefix} on {interface_name} with gateway {gateway} and DNS servers {dns_servers}')

        connection_settings = {
            'connection': {
                'id': connection_id,
                'type': '802-3-ethernet',
                'interface-name': interface_name,
                'autoconnect': True,
            },
            'ipv4': {
                # Set the method to manual
                'method': 'manual',
                'address-data': dbus.Array([
                    {
                        'address': ip_address,
                        'prefix': dbus.UInt32(int(prefix)),
                    }
                ], signature=dbus.Signature('a{sv}')),
                'gateway': gateway,
                'dns-search': dbus.Array(dns_servers, signature=dbus.Signature('s')),
            },
            'ipv6': {
                'method': 'ignore',
            }
        }

        if prioritize_wireless:
            connection_settings['ipv4']['route-metric'] = 200
            connection_settings['ipv4']['never-default'] = True

        return self.update_connection(interface_name, connection_id, connection_settings, activate=True)
        
    @handle_dbus_exceptions
    def set_dynamic_ip(self, interface_name: str = 'enp3s0', prioritize_wireless=False, connection_id: str = 'Wired connection 1'):
        '''
        Set the dynamic IP address

        :param interface_name: The name of the interface to set the dynamic IP address on
        :param connection_id: The ID of the connection to set the dynamic IP address on
        :return: The interface name of the ethernet device
        '''
        connection_settings = {
            'connection': {
                'id': connection_id,
                'type': '802-3-ethernet',
                'interface-name': interface_name,
                'autoconnect': True,
            },
            'ipv4': {
                'method': 'auto',
                'route-metric': 200, # Make sure that Wireless is preferred over Wired
                'never-default': True,
            },
            'ipv6': {
                'method': 'ignore',
            }
        }

        if prioritize_wireless:
            connection_settings['ipv4']['route-metric'] = 200
            connection_settings['ipv4']['never-default'] = True

        return self.update_connection(interface_name, connection_id, connection_settings, activate=True)

    def _find_connection_by_id(self, connection_id: str):
        '''
        Find a connection by its ID
        '''
        for connection in self._list_connections():
            if connection.GetSettings()['connection']['id'] == connection_id:
                return connection.object_path
        
        
    def _get_ethernet_device(self, interface_name: str | None = None):
        '''
        Get the path of the ethernet device with the given interface name

        :param interface_name: The name of the interface to get the ethernet device for
        :return: The path of the ethernet device
        '''
        devices = self.interface.GetDevices()

        if not devices:
            raise NMException('No devices found')

        devs = []

        for dev_path in devices:
            dev_proxy = self.bus.get_object('org.freedesktop.NetworkManager', dev_path)
            dev_props = dbus.Interface(dev_proxy, 'org.freedesktop.DBus.Properties')
            dev_type = dev_props.Get('org.freedesktop.NetworkManager.Device', 'DeviceType')
            dev_interface = dev_props.Get('org.freedesktop.NetworkManager.Device', 'Interface')

            if dev_type == 1:
                devs.append((dev_path, dev_proxy, dev_interface))

        if len(devs) == 0:
            raise NMException('No ethernet devices found')
        
        # If an interface name is provided, return the device with the matching interface name
        # Otherwise, return the first ethernet device found
        if interface_name:
            for (dev_path, dev_proxy, dev_interface) in devs:
                if dev_interface == interface_name:
                    return (dev_path, dev_proxy)

        return devs[0][0:2]
            

    @handle_dbus_exceptions
    def connect(self, ssid: str, password=''):
        (wifi_dev, dev_proxy) = self._get_wifi_device()
        if wifi_dev is None:
            raise NMException('No WiFi device found')

        wifi_interface = dbus.Interface(dev_proxy, 'org.freedesktop.NetworkManager.Device.Wireless')
        # Do not need to request a scan since the scan must have happened for the user to know this network exists
        access_points = wifi_interface.GetAllAccessPoints()

        ap_path = None
        ap_requires_password = False
        for ap in access_points:
            ap_proxy = self.bus.get_object('org.freedesktop.NetworkManager', ap)
            ap_props = dbus.Interface(ap_proxy, 'org.freedesktop.DBus.Properties')
            ap_ssid = ap_props.Get('org.freedesktop.NetworkManager.AccessPoint', 'Ssid')
            ssid_str = ''.join([chr(byte) for byte in ap_ssid])

            if ssid_str == ssid:
                ap_path = ap

                # Check the security of the AP
                flags = ap_props.Get('org.freedesktop.NetworkManager.AccessPoint', 'Flags')
                wpa_flags = ap_props.Get('org.freedesktop.NetworkManager.AccessPoint', 'WpaFlags')
                rsn_flags = ap_props.Get('org.freedesktop.NetworkManager.AccessPoint', 'RsnFlags')
                ap_requires_password = self._ap_requires_password(flags, wpa_flags, rsn_flags)
                break

        if ap_path is None:
            raise NMException(f'Access point with SSID {ssid} not found')

        # Create the settings object assuming no password is needed
        connection_settings = {
            '802-11-wireless': {
                'ssid': dbus.ByteArray(ssid.encode('utf-8')),
                'mode': 'infrastructure'
            },
            'connection': {
                'id': ssid,
                'type': '802-11-wireless'
            },
            'ipv4': {
                'method': 'auto'
            },
            'ipv6': {
                'method': 'ignore'
            }
        }

        # Add security settings if the network requires a password
        if ap_requires_password:
            connection_settings['802-11-wireless-security'] = {
                'key-mgmt': 'wpa-psk',
                'psk': password
            }

        settings_proxy = self.bus.get_object('org.freedesktop.NetworkManager', '/org/freedesktop/NetworkManager/Settings')
        settings_interface = dbus.Interface(settings_proxy, 'org.freedesktop.NetworkManager.Settings')

        connection_path = settings_interface.AddConnection(connection_settings)
        self.interface.ActivateConnection(connection_path, dev_proxy, ap_path)

    @handle_dbus_exceptions
    def disconnect(self):
        '''
        Disconnect from any connected network
        '''
        (wifi_dev, dev_proxy) = self._get_wifi_device()

        if not wifi_dev:
            raise Exception('No WiFi device found')

        dev_props = dbus.Interface(dev_proxy, 'org.freedesktop.DBus.Properties')
        active_connection = dev_props.Get('org.freedesktop.NetworkManager.Device', 'ActiveConnection')
        self.interface.DeactivateConnection(active_connection)

    @handle_dbus_exceptions
    def list_wireless_connections(self) -> List[Connection]:
        '''
        Get a list of the active wireless connections
        '''
        return self.list_connections()

    @handle_dbus_exceptions
    def get_active_wireless_connection(self) -> Connection | None:
        '''
        Get the first active wireless connection
        '''
        active_wireless_conections = list(self.get_active_connections())
        return None if len(active_wireless_conections) == 0 else active_wireless_conections[0]

    @handle_dbus_exceptions
    def list_connections(self, only_wireless=True) -> List[Connection]:
        '''
        Get a list of all the connections saved
        '''
        connections = []
        for connection in self._list_connections():
            config = connection.GetSettings()
            new_connection = Connection(id=config['connection']['id'], type=config['connection']['type'])
            # Filter
            if not only_wireless or 'wireless' in config['connection']['type'] and not new_connection in connections:
                connections.append(new_connection)
        return connections

    @handle_dbus_exceptions
    def get_active_connections(self, wireless_only=True) -> List[Connection]:
        '''
        Get a list of active connections, including wired
        '''
        active_connections = self.props.Get('org.freedesktop.NetworkManager', 'ActiveConnections')
        connections = []
        for connection_path in active_connections:
            active_conn_proxy = self.bus.get_object('org.freedesktop.NetworkManager', connection_path)
            active_conn = dbus.Interface(active_conn_proxy, 'org.freedesktop.DBus.Properties')

            settings_path = active_conn.Get('org.freedesktop.NetworkManager.Connection.Active', 'Connection')
            conn_proxy = self.bus.get_object('org.freedesktop.NetworkManager', settings_path)
            connection = dbus.Interface(conn_proxy, 'org.freedesktop.NetworkManager.Settings.Connection')
            config = connection.GetSettings()

            if not wireless_only or 'wireless' in config['connection']['type']:
                connections.append(Connection(id=config['connection']['id'], type=config['connection']['type']))

        return connections

    @handle_dbus_exceptions
    def get_access_points(self) -> List[AccessPoint]:
        '''
        Get wifi networks without a scan
        '''
        (wifi_dev,_) = self._get_wifi_device()
        if not wifi_dev:
            raise NMException('No WiFi device found')
        return self._get_access_points(wifi_dev)


    @handle_dbus_exceptions
    def scan_wifi(self, is_scanning_func: Callable[[], bool], timeout=30) -> List[AccessPoint]:
        '''
        Scan wifi networks
        '''
        (wifi_dev, dev_proxy) = self._get_wifi_device()

        if not wifi_dev:
            raise NMException('No WiFi device found')

        wifi_props = dbus.Interface(dev_proxy, 'org.freedesktop.DBus.Properties')

        # get the timestamp of the last scan
        last_scan = wifi_props.Get('org.freedesktop.NetworkManager.Device.Wireless', 'LastScan')

        # request a scan
        wifi_dev.RequestScan({})

        # wait for scan to finish
        start_time = time.time()
        # Check if it is still allowed to complete the scan, is_scanning_func should return false when the program is killed
        while is_scanning_func() and time.time() - start_time < timeout:
            current_scan = wifi_props.Get('org.freedesktop.NetworkManager.Device.Wireless', 'LastScan')

            if current_scan != last_scan:
                # scan 'd, return the access points
                return self._get_access_points(wifi_dev)

            # wait before checking
            time.sleep(0.1)

        # Took too long to complete scan
        raise NMException('Request timed out')

    @handle_dbus_exceptions
    def forget(self, ssid: str):
        '''
        Forget a network
        '''
        for connection in self._list_connections():
            config = connection.GetSettings()
            # ensure config being None cannot cause issues
            if config == None:
                logging.warning('Failed to get config from connection')
                continue
            try:
                if config['connection']['id'] == ssid:
                    connection.Delete()
            except KeyError as e:
                raise NMException(f'Error occurred when attempting to forget network: {str(e)}')

    '''
    NOTE: All private functions should not have DBusException error handling
    '''

    def _get_wifi_device(self):
        devices = self.interface.GetDevices()
        if devices == None:
            logging.warning('Failed to retrieve device list')
            devices = []
        for dev_path in devices:
            dev_proxy = self.bus.get_object('org.freedesktop.NetworkManager', dev_path)
            dev_props = dbus.Interface(dev_proxy, 'org.freedesktop.DBus.Properties')
            dev_type = dev_props.Get('org.freedesktop.NetworkManager.Device', 'DeviceType')

            # is wifi device
            if dev_type == 2:
                wifi_dev = dbus.Interface(dev_proxy, 'org.freedesktop.NetworkManager.Device.Wireless')
                return (wifi_dev, dev_proxy)
        return (None, None)

    def _get_access_points(self, wifi_dev) -> List[AccessPoint]:
        '''
        Get a list of access points. Should only be called after scanning for networks
        '''
        access_points: List[AccessPoint] = []
        wifi_access_points = wifi_dev.GetAccessPoints()
        if wifi_access_points == None:
            return []
        for ap_path in wifi_access_points:
            ap_proxy = self.bus.get_object('org.freedesktop.NetworkManager', ap_path)
            ap_props = dbus.Interface(ap_proxy, 'org.freedesktop.DBus.Properties')

            ssid = ap_props.Get('org.freedesktop.NetworkManager.AccessPoint', 'Ssid')
            strength = ap_props.Get('org.freedesktop.NetworkManager.AccessPoint', 'Strength')
            flags = ap_props.Get('org.freedesktop.NetworkManager.AccessPoint', 'Flags')
            wpa_flags = ap_props.Get('org.freedesktop.NetworkManager.AccessPoint', 'WpaFlags')
            rsn_flags = ap_props.Get('org.freedesktop.NetworkManager.AccessPoint', 'RsnFlags')

            requires_password = self._ap_requires_password(flags, wpa_flags, rsn_flags)

            access_points.append(AccessPoint(ssid=''.join([chr(byte) for byte in ssid]), strength=int(strength), requires_password=requires_password))

        return sorted(access_points, key=lambda ap: ap.strength, reverse=True)

    def _ap_requires_password(self, flags: int, wpa_flags: int, rsn_flags: int):
        '''
        Check if a given access point requires password
        '''
        NM_802_11_AP_FLAGS_PRIVACY = 0x1

        # check the overall flags and additionally check if there are any security flags which would indicate a password is needed
        return flags & NM_802_11_AP_FLAGS_PRIVACY == 1 or wpa_flags != 0 or rsn_flags != 0

    def _get_connection_proxy(self, active_connection):
        # Get the connection details from the active connection
        connection_proxy = dbus.Interface(self.bus.get_object('org.freedesktop.NetworkManager', active_connection),
                                        'org.freedesktop.DBus.Properties')

        # Get the connection path (this will give us the object path for the connection)
        connection_path = connection_proxy.Get('org.freedesktop.NetworkManager.Connection.Active', 'Connection')

        # Return the connection proxy object based on the connection path
        return self.bus.get_object('org.freedesktop.NetworkManager', connection_path)

    def _list_connections(self) -> List[dbus.Interface]:
        connections = []

        settings_proxy = self.bus.get_object('org.freedesktop.NetworkManager', '/org/freedesktop/NetworkManager/Settings')
        settings = dbus.Interface(settings_proxy, 'org.freedesktop.NetworkManager.Settings')

        # List all the connections saved
        # This might have repeats for some reason, so this needs to be filtered
        connections_list = settings.ListConnections()
        if connections_list == None:
            return []
        for connection_path in connections_list:
            proxy = self.bus.get_object('org.freedesktop.NetworkManager', connection_path)
            connection = dbus.Interface(proxy, 'org.freedesktop.NetworkManager.Settings.Connection')
            connections.append(connection)

        return connections
