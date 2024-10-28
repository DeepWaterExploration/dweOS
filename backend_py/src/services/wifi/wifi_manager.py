from .wifi_types import NetworkConfig, Status, Connection
from .schemas import AccessPointSchema, ConnectionSchema, StatusSchema
import threading
import time
import logging
from .network_manager import NetworkManager, NMException, NMNotSupportedError
from .exceptions import WiFiException

class WiFiManager:

    def __init__(self, scan_interval=10) -> None:
        try:
            self.nm = NetworkManager()
            raise NMException()
        except NMException:
            # raise WiFiException('NetworkManager is not supported')
            logging.warning('NetworkManager is not supported.')
            self.nm = None
        
        self._update_thread = threading.Thread(target=self._update)
        self._scan_thread = threading.Thread(target=self._scan) # Secondary thread is needed to conduct scans separately
        self._is_scanning = False
        self.scan_interval = scan_interval
        self.connections = []

        self.to_forget: str | None = None
        self.to_disconnect = False
        self.to_connect: NetworkConfig | None = None

        # Changed to true after successfully completed a scan
        self.status = Status(connection=Connection(), finished_first_scan=False, connected=False)

        # get initial access points before scan
        if self.nm is not None:
            try:
                self.access_points = self.nm.get_access_points()
            except NMException as e:
                raise WiFiException(f'Error occurred while initializing access points {e}') from e
        else:
            self.access_points = []

    def connect(self, ssid: str, password = ''):
        self.to_connect = NetworkConfig(ssid, password)

    def disconnect(self):
        self.to_disconnect = True

    def start_scanning(self):
        if not self.nm:
            return
        logging.info('Starting WiFi Manager...')
        self._is_scanning = True
        self._update_thread.start()
        self._scan_thread.start()

    def stop_scanning(self):
        if not self.nm:
            return
        self._is_scanning = False
        self._update_thread.join()
        self._scan_thread.join()

    def get_access_points(self):
        return AccessPointSchema().dump(self.access_points, many=True)

    def get_status(self):
        return StatusSchema().dump(self.status)

    def list_connections(self):
        return ConnectionSchema().dump(self.connections, many=True)

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
