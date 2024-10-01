from typing import List
from dataclasses import dataclass
import nmcli

@dataclass
class ScanResult:
    name: str
    bssid: str
    signal: int
    in_use: bool
    password_required: bool

class WiFiManager:
    def __init__(self) -> None:
        self.active_connection = self._get_connection()
        self.connections = self._get_connections()
        self.scan_results = self._scan()

        print(f'Active Connection: {self.active_connection}')
        print(f'Connections: {self.connections}')
        print(f'Scan Results: {self.scan_results}')

    def connect(self, ssid: str, password: str = ''):
        nmcli.device.wifi_connect(ssid, password)

    def disconnect(self):
        nmcli.device.disconnect()
    
    def _scan(self) -> List[ScanResult]:
        results = []
        for device_wifi in nmcli.device.wifi(rescan=True):
            results.append(
                ScanResult(device_wifi.ssid, device_wifi.bssid, device_wifi.signal, device_wifi.in_use, 'WPA2' in device_wifi.security)
            )
        return results
        
    def _get_connections(self) -> List[str]:
        wifi_connections = []
        for connection in nmcli.connection():
            if connection.conn_type == 'wifi':
                wifi_connections.append(connection.name)
        return wifi_connections

    def _get_connection(self) -> None | str:
        devices = nmcli.device.status()
        wifi_device = None
        for device in devices:
            if device.device_type == 'wifi':
                wifi_device = device
        
        if wifi_device is not None:
            return wifi_device.connection
        
        return None
    
wifi_manager = WiFiManager()
wifi_manager.connect('Brandon_5G-2')
