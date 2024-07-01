from typing import *
import logging
import time
import threading
import re

from .schemas import *
from .device import Device, lookup_pid_vid, DeviceInfo, DeviceType
from .settings import SettingsManager
from .broadcast_server import BroadcastServer, Message
from .enumeration import list_devices
from .utils import list_diff

from .devices.ehd import EHDDevice
from .devices.shd import SHDDevice


class DeviceManager:
    '''
    Class for interfacing with and monitoring devices
    '''

    def __init__(self, broadcast_server=BroadcastServer(), settings_manager=SettingsManager()) -> None:
        self.devices: List[Device] = []
        self.broadcast_server = broadcast_server
        self.settings_manager = settings_manager

        self._thread = threading.Thread(target=self._monitor)
        self._is_monitoring = False

    def start_monitoring(self):
        self._is_monitoring = True
        self._thread.start()

    def stop_monitoring(self):
        self._is_monitoring = False
        self._thread.join()

        for device in self.devices:
            device.stream.stop()

    @staticmethod
    def create_device(device_info: DeviceInfo) -> Device | None:
        (_, device_type) = lookup_pid_vid(device_info.vid, device_info.pid)

        match device_type:
            case DeviceType.EXPLOREHD:
                return EHDDevice(device_info)
            case DeviceType.STELLARHD:
                return SHDDevice(device_info)
            case _:
                # Not a DWE device
                return None

    def get_devices(self):
        '''
        Compile and sort a list of devices for jsonifcation
        '''
        device_list = DeviceSchema().dump(self.devices, many=True)
        key_pattern = re.compile(r'^(\D+)(\d+)$')

        def key(item: Dict):
            # Get the integer at the end of the path
            try:
                m = key_pattern.match(item['cameras'][0]['path'])
                return int(m.group(2))
            except:
                return -1
        device_list.sort(key=key)
        return device_list

    def set_device_option(self, bus_info: str, option: str, option_value: int | bool) -> bool:
        '''
        Set a device option
        '''
        device = self._find_device_with_bus_info(bus_info)
        if not device:
            return False
        device.set_option(option, option_value)

        self.settings_manager.save_device(device)
        return True

    def get_next_port(self, host: str) -> int:
        '''
        Get the next available port
        '''
        ports = []
        for device in self.devices:
            if device.stream:
                for endpoint in device.stream.endpoints:
                    if endpoint.host == host:
                        ports.append(endpoint.port)

        if len(ports) == 0:
            return 5600  # base port

        ports.sort(reverse=True)

        return ports[0] + 1

    def configure_device_stream(self, bus_info: str, stream_info: StreamInfoSchema) -> bool:
        '''
        Configure a device's stream with the given stream info
        '''
        device = self._find_device_with_bus_info(bus_info)
        if not device:
            return False

        stream_format = stream_info['stream_format']
        width: int = stream_format['width']
        height: int = stream_format['height']
        interval: Interval = Interval(
            stream_format['interval']['numerator'], stream_format['interval']['denominator'])
        encode_type: StreamEncodeTypeEnum = stream_info['encode_type']
        endpoints = stream_info['endpoints']

        device.configure_stream(encode_type, width, height,
                                interval, StreamTypeEnum.UDP, endpoints)
        device.stream.start()

        self.settings_manager.save_device(device)
        return True

    def uncofigure_device_stream(self, bus_info: str) -> bool:
        '''
        Remove a device stream (unconfigure)
        '''
        device = self._find_device_with_bus_info(bus_info)
        if not device:
            return False

        device.unconfigure_stream()

        self.settings_manager.save_device(device)
        return True

    def set_device_nickname(self, bus_info: str, nickname: str) -> bool:
        '''
        Set a device nickname
        '''
        device = self._find_device_with_bus_info(bus_info)
        if not device:
            return False

        device.nickname = nickname

        self.settings_manager.save_device(device)
        return True

    def set_device_uvc_control(self, bus_info: str, control_id: int, control_value: int) -> bool:
        '''
        Set a device UVC control
        '''
        device = self._find_device_with_bus_info(bus_info)
        if not device:
            return False

        device.set_pu(control_id, control_value)

        self.settings_manager.save_device(device)
        return True

    def _find_device_with_bus_info(self, bus_info: str) -> Device | None:
        for device in self.devices:
            if device.bus_info == bus_info:
                return device
        logging.error(f'Device not found: {bus_info}')
        return None

    def _monitor(self):
        # monitor devices for changes
        devices_info = list_devices()

        for device_info in devices_info:
            device = None
            try:
                device = self.create_device(device_info)
                if not device:
                    continue
            except Exception as e:
                logging.warn(e)
                continue
            # append the device to the device list
            self.devices.append(device)
            # load the settings
            self.settings_manager.load_device(device)

        old_device_list = devices_info

        while self._is_monitoring:
            devices_info = list_devices()

            # find the new devices
            new_devices = list_diff(devices_info, old_device_list)

            # find the removed devices
            removed_devices = list_diff(old_device_list, devices_info)

            # add the new devices
            for device_info in new_devices:
                device = None
                try:
                    device = self.create_device(device_info)
                    if not device:
                        continue
                except Exception as e:
                    logging.warning(e)
                    continue
                # append the device to the device list
                self.devices.append(device)
                # load the settings
                self.settings_manager.load_device(device)
                # add the device info to the device list
                old_device_list.append(device_info)

                # Output device to log (after loading settings)
                logging.info(f'Device Added: {device_info.bus_info}')

                self.broadcast_server.broadcast(Message(
                    'device_added', DeviceSchema().dump(device)
                ))

            # remove the old devices
            for device_info in removed_devices:
                for device in self.devices:
                    if device.device_info == device_info:
                        device.stream.stop()
                        self.devices.remove(device)
                        # remove the device info from the old device list
                        old_device_list.remove(device_info)
                        logging.info(f'Device Removed: {device_info.bus_info}')

                        self.broadcast_server.broadcast(Message('device_removed', {
                            'bus_info': device_info.bus_info
                        }))

            # do not overload the bus
            time.sleep(0.1)
