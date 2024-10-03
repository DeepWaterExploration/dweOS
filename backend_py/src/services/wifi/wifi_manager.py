from .wifi_types import NetworkConfig
from .schemas import AccessPointSchema, ConnectionSchema
import threading
import time
import logging
from .network_manager import NetworkManager
from dbus import DBusException

class WiFiManager:

    def __init__(self, scan_interval=10) -> None:
        self.nm = NetworkManager()
        self._update_thread = threading.Thread(target=self._update)
        self._scan_thread = threading.Thread(target=self._scan) # Secondary thread is needed to conduct scans separately
        self._is_scanning = False
        self.scan_interval = scan_interval
        self.connections = []
        self.active_connection = {}

        self.to_forget: str = None
        self.to_disconnect = False
        self.to_connect: NetworkConfig = None

        # get initial access points before scan
        self.access_points = self.nm.get_access_points()

    def connect(self, ssid: str, password = '') -> bool:
        self.to_connect = NetworkConfig(ssid, password)
    
    def disconnect(self):
        self.to_disconnect = True

    def start_scanning(self):
        logging.info('Starting WiFi Manager...')
        self._is_scanning = True
        self._update_thread.start()
        self._scan_thread.start()

    def stop_scanning(self):
        self._is_scanning = False
        self._update_thread.join()
        self._scan_thread.join()

    def get_access_points(self):
        return AccessPointSchema().dump(self.access_points, many=True)
    
    def get_active_connection(self):
        return ConnectionSchema().dump(self.active_connection)
    
    def list_connections(self):
        return ConnectionSchema().dump(self.connections, many=True)

    def forget(self, ssid: str):
        self.to_forget = ssid

    def _forget(self):
        self.nm.forget(self.to_forget)
        self.to_forget = None

    def _connect(self):
        logging.info(f'Connecting to network: {self.to_connect.ssid}')
        try:
            self.nm.connect(self.to_connect.ssid, self.to_connect.password)
        except Exception:
            logging.error(f'Failed to connect to network: {self.to_connect.ssid}')
        self.to_connect = None

    def _disconnect(self):
        logging.info('Disconnecting from network')
        try:
            self.nm.disconnect()
        except DBusException as e:
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
                try:
                    # Make sure the scan stops when we are no longer scanning
                    self.access_points = self.nm.scan_wifi(lambda: self._is_scanning)
                except TimeoutError as e:
                    logging.warning(e)
                
                # reset the counter
                start_time = current_time

            # No reason to check too often
            time.sleep(0.1)

    def _update(self):
        while self._is_scanning:
            # Queue requests to the network manager to avoid issues

            self.connections = self.nm.list_wireless_connections()
            self.active_connection = self.nm.get_active_wireless_connection()

            if not self.to_forget is None:
                self._forget()

            if not self.to_connect is None:
                self._connect()

            if self.to_disconnect:
                self._disconnect()

            # No reason to check too often
            time.sleep(0.1)
