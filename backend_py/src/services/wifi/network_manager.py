import dbus
from typing import List
import time
from wifi_types import Connection, AccessPoint


class NetworkManager:
    '''
    Class for interfacing with NetworkManager over dbus
    '''

    def __init__(self) -> None:
        self.bus = dbus.SystemBus()
        self.proxy = self.bus.get_object('org.freedesktop.NetworkManager', '/org/freedesktop/NetworkManager')
        self.interface = dbus.Interface(self.proxy, 'org.freedesktop.NetworkManager')
        self.props = dbus.Interface(self.proxy, 'org.freedesktop.DBus.Properties')

    def list_wireless_connections(self) -> List[Connection]:
        '''
        Get a list of the active wireless connections
        '''
        return list(filter(lambda conn: 'wireless' in conn.type, self.list_connections()))
    
    def get_active_wireless_connection(self) -> Connection | None:
        '''
        Get the first active wireless connection
        '''
        active_wireless_conections = list(filter(lambda conn: 'wireless' in conn.type, self.get_active_connections()))
        return None if len(active_wireless_conections) == 0 else active_wireless_conections[0]

    def list_connections(self) -> List[Connection]:
        '''
        Get a list of all the connections saved
        '''
        connections = []
        settings_proxy = self.bus.get_object('org.freedesktop.NetworkManager', '/org/freedesktop/NetworkManager/Settings')
        settings = dbus.Interface(settings_proxy, 'org.freedesktop.NetworkManager.Settings')
        
        for connection_path in settings.ListConnections():
            proxy = self.bus.get_object('org.freedesktop.NetworkManager', connection_path)
            connection = dbus.Interface(proxy, 'org.freedesktop.NetworkManager.Settings.Connection')
            config = connection.GetSettings()
            connections.append(Connection(config['connection']['id'], config['connection']['type']))
        return connections
    
    def get_active_connections(self) -> List[Connection]:
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

            connections.append(Connection(config['connection']['id'], config['connection']['type']))

        return connections
    
    def scan_wifi(self, timeout=30) -> List[AccessPoint]:
        '''
        Scan wifi networks
        '''
        devices = self.interface.GetDevices()
        for dev_path in devices:
            dev_proxy = self.bus.get_object('org.freedesktop.NetworkManager', dev_path)
            dev_props = dbus.Interface(dev_proxy, 'org.freedesktop.DBus.Properties')
            dev_type = dev_props.Get('org.freedesktop.NetworkManager.Device', 'DeviceType')

            # is wifi device
            if dev_type == 2:
                wifi_dev = dbus.Interface(dev_proxy, 'org.freedesktop.NetworkManager.Device.Wireless')
                wifi_props = dbus.Interface(dev_proxy, 'org.freedesktop.DBus.Properties')

                # get the timestamp of the last scan
                last_scan = wifi_props.Get('org.freedesktop.NetworkManager.Device.Wireless', 'LastScan')

                # request a scan
                wifi_dev.RequestScan({})

                # wait for scan to finish
                start_time = time.time()
                while time.time() - start_time < timeout:
                    current_scan = wifi_props.Get('org.freedesktop.NetworkManager.Device.Wireless', 'LastScan')

                    if current_scan != last_scan:
                        # scan 'd, return the access points
                        return self._get_access_points(wifi_dev)
                    
                    # wait before checking
                    time.sleep(0.1)
                
                raise TimeoutError('Request timed out')
            
        return []

    def _get_access_points(self, wifi_dev) -> List[AccessPoint]:
        '''
        Get a list of access points. Should only be called after scanning for networks
        '''
        access_points: List[AccessPoint] = []
        for ap_path in wifi_dev.GetAccessPoints():
            ap_proxy = self.bus.get_object('org.freedesktop.NetworkManager', ap_path)
            ap_props = dbus.Interface(ap_proxy, 'org.freedesktop.DBus.Properties')
            
            ssid = ap_props.Get('org.freedesktop.NetworkManager.AccessPoint', 'Ssid')
            strength = ap_props.Get('org.freedesktop.NetworkManager.AccessPoint', 'Strength')
            flags = ap_props.Get('org.freedesktop.NetworkManager.AccessPoint', 'Flags')
            wpa_flags = ap_props.Get('org.freedesktop.NetworkManager.AccessPoint', 'WpaFlags')
            rsn_flags = ap_props.Get('org.freedesktop.NetworkManager.AccessPoint', 'RsnFlags')
            
            requires_password = self._ap_requires_password(flags, wpa_flags, rsn_flags)

            access_points.append(AccessPoint(''.join([chr(byte) for byte in ssid]), int(strength), requires_password))
        
        return sorted(access_points, key=lambda ap: ap.strength, reverse=True)

    def _ap_requires_password(self, flags: int, wpa_flags: int, rsn_flags: int):
        '''
        Check if a given access point requires password
        '''
        NM_802_11_AP_FLAGS_PRIVACY = 0x1

        # check the overall flags and additionally check if there are any security flags which would indicate a password is needed
        return flags & NM_802_11_AP_FLAGS_PRIVACY or wpa_flags != 0 or rsn_flags != 0

nm = NetworkManager()
print ('All Conections')
for conn in nm.list_wireless_connections():
    print(f'{conn.id}: {conn.type}')

print()

active_wireless = nm.get_active_wireless_connection()
print (f'Active Connection: {active_wireless.id} ({active_wireless.type})')

print()

for ap in nm.scan_wifi(timeout=30):
    print(f'{ap.ssid}: {ap.strength} - {"Password Auth" if ap.requires_password else ""}')
