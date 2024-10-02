from typing import List
from .wifi_types import AccessPoint
from .schemas import AccessPointSchema, ConnectionSchema
import threading
import time
import logging
from .network_manager import NetworkManager
from dbus import DBusException

class WiFiManager:

    def __init__(self, scan_interval=10) -> None:
        self.nm = NetworkManager()
        self._thread = threading.Thread(target=self._scan)
        self._is_scanning = False
        self.scan_interval = scan_interval

        # get initial access points before scan
        self.access_points = self.nm.get_access_points()

    def connect(self, ssid: str, password = '') -> bool:
        try:
            self.nm.connect(ssid, password)
        except:
            return False
        return True
    
    def disconnect(self):
        try:
            self.nm.disconnect()
        except DBusException as e:
            # ignore exception
            pass

    def start_scanning(self):
        self._is_scanning = True
        self._thread.start()

    def stop_scanning(self):
        self._is_scanning = False
        self._thread.join()

    def get_access_points(self):
        return AccessPointSchema().dump(self.access_points, many=True)
    
    def get_active_connection(self):
        return ConnectionSchema().dump(self.nm.get_active_wireless_connection())
    
    def list_connections(self):
        return ConnectionSchema().dump(self.nm.list_wireless_connections(), many=True)

    def forget(self, ssid: str):
        self.nm.forget(ssid)

    def _scan(self):
        start_time = time.time()
        while self._is_scanning:
            current_time = time.time()
            elapsed_time = current_time - start_time

            # this is used so the server does not hang on close
            if elapsed_time >= self.scan_interval:
                try:
                    self.access_points = self.nm.scan_wifi()
                except TimeoutError as e:
                    logging.warning(e)
                
                # reset the counter
                start_time = current_time

            # No reason to check too often
            time.sleep(0.1)
