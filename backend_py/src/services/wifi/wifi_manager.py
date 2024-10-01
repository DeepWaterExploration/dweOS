from typing import List
from wifi_types import AccessPoint
from schemas import AccessPointSchema, ConnectionSchema
import threading
import time
import logging
from network_manager import NetworkManager

class WiFiManager:

    def __init__(self) -> None:
        self.nm = NetworkManager()
        self._thread = threading.Thread(target=self._scan)
        self._is_scanning = False
        self.access_points: List[AccessPoint]

    def start_scanning(self):
        self._is_scanning = True
        self._thread.start()

    def get_access_points(self):
        return AccessPointSchema().dump(self.access_points, many=True)
    
    def list_connections(self):
        return ConnectionSchema().dump(self.nm.list_wireless_connections(), many=True)

    def _scan(self):
        while self._is_scanning:
            try:
                self.access_points = self.nm.scan_wifi()
            except TimeoutError as e:
                logging.warning(e)

            # sleep to allow for rescanning later
            time.sleep(10)
