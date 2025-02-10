from typing import *
import logging
import time
import threading
import re
import event_emitter as events
import asyncio

from .pydantic_schemas import *
from .device import Device, lookup_pid_vid, DeviceInfo, DeviceType
from .settings import SettingsManager
from .enumeration import list_devices
from .device_utils import list_diff, find_device_with_bus_info
from .exceptions import DeviceNotFoundException

import socketio

from .ehd import EHDDevice
from .shd import SHDDevice

def todict(obj, classkey=None):
    if isinstance(obj, dict):
        data = {}
        for (k, v) in obj.items():
            data[k] = todict(v, classkey)
        return data
    elif hasattr(obj, "_ast"):
        return todict(obj._ast())
    elif hasattr(obj, "__iter__") and not isinstance(obj, str):
        return [todict(v, classkey) for v in obj]
    elif hasattr(obj, "__dict__"):
        data = dict([(key, todict(value, classkey)) 
            for key, value in obj.__dict__.items() 
            if not callable(value) and not key.startswith('_')])
        if classkey is not None and hasattr(obj, "__class__"):
            data[classkey] = obj.__class__.__name__
        return data
    else:
        return obj

class DeviceManager(events.EventEmitter):
    '''
    Class for interfacing with and monitoring devices
    '''

    def __init__(self, sio: socketio.Server, settings_manager=SettingsManager()) -> None:
        self.devices: List[Device] = []
        self.sio = sio
        self.settings_manager = settings_manager
        self._is_monitoring = False
        # List of devices with gstreamer errors
        self.gst_errors: List[str] = []

    def start_monitoring(self):
        '''
        Begin monitoring for devices in the background
        '''
        self._is_monitoring = True
        asyncio.create_task(self._monitor())

    def stop_monitoring(self):
        '''
        Stop monitoring for devices
        '''
        self._is_monitoring = False

        for device in self.devices:
            device.stream.stop()

    def create_device(self, device_info: DeviceInfo) -> Device | None:
        '''
        Create a new device based on enumerated device info
        '''
        (_, device_type) = lookup_pid_vid(device_info.vid, device_info.pid)

        device = None
        match device_type:
            case DeviceType.EXPLOREHD:
                device = EHDDevice(device_info)
            case DeviceType.STELLARHD_LEADER:
                device = SHDDevice(device_info)
            case DeviceType.STELLARHD_FOLLOWER:
                device = SHDDevice(device_info, False)
            case _:
                # Not a DWE device
                return None

        # we need to broadcast that there was a gst error so that the frontend knows there may be a kernel issue
        device.stream_runner.on('gst_error', lambda _: self.gst_errors.append(device.bus_info))

        return device

    def get_devices(self):
        '''
        Compile and sort a list of devices for jsonifcation
        '''
        device_list = [DeviceModel.model_validate(device) for device in self.devices]
        return device_list

    def set_device_option(self, bus_info: str, option: str, option_value: int | bool) -> bool:
        '''
        Set a device option
        '''
        device = self._find_device_with_bus_info(bus_info)

        device.set_option(option, option_value)

        self.settings_manager.save_device(device)
        return True

    def configure_device_stream(self, stream_info: StreamInfoModel) -> bool:
        '''
        Configure a device's stream with the given stream info
        '''
        device = self._find_device_with_bus_info(stream_info.bus_info)

        stream_format = stream_info.stream_format
        width: int = stream_format.width
        height: int = stream_format.height
        interval = stream_format.interval
        encode_type: StreamEncodeTypeEnum = stream_info.encode_type
        endpoints = stream_info.endpoints

        device.configure_stream(encode_type, width, height,
                                interval, StreamTypeEnum.UDP, endpoints)
        device.start_stream()

        self.settings_manager.save_device(device)
        return True

    def unconfigure_device_stream(self, bus_info: str) -> bool:
        '''
        Remove a device stream (unconfigure)
        '''
        device = self._find_device_with_bus_info(bus_info)
        if not device:
            return False

        device.unconfigure_stream()

        self.settings_manager.save_device(device)

        # Remove leader if leader stops stream
        if device.device_type == DeviceType.STELLARHD_LEADER and cast(SHDDevice, device).follower:
            self.remove_leader(cast(SHDDevice, device).follower)
        return True

    def set_device_nickname(self, bus_info: str, nickname: str) -> bool:
        '''
        Set a device nickname
        '''
        device = self._find_device_with_bus_info(bus_info)

        device.nickname = nickname

        self.settings_manager.save_device(device)
        return True

    def set_device_uvc_control(self, bus_info: str, control_id: int, control_value: int) -> bool:
        '''
        Set a device UVC control
        '''
        device = self._find_device_with_bus_info(bus_info)

        device.set_pu(control_id, control_value)

        self.settings_manager.save_device(device)
        return True
    
    def set_leader(self, leader_bus_info: str, follower_bus_info: str) -> bool:
        '''
        Set the leader_bus_info as the leader for the follower_bus_info device
        '''
        follower_device = self._find_device_with_bus_info(follower_bus_info)
        leader_device = self._find_device_with_bus_info(leader_bus_info)

        if follower_device.device_type == DeviceType.STELLARHD_FOLLOWER:
            cast(SHDDevice, follower_device).set_leader(leader_device)
            self.settings_manager.save_device(follower_device)
        else:
            logging.warn('Attempting to add leader to a non follower device type.')
            return False
        return True
    
    def remove_leader(self, bus_info: str) -> bool:
        '''
        Remove leader from follower
        '''
        follower_device = self._find_device_with_bus_info(bus_info)
        if follower_device.device_type == DeviceType.STELLARHD_FOLLOWER:
            cast(SHDDevice, follower_device).remove_leader()
            self.settings_manager.save_device(follower_device)
        else:
            logging.warning('Attempting to remove leader from a non follower device type.')
            return False
        return True

    def _find_device_with_bus_info(self, bus_info: str) -> Device | None:
        '''
        Utility to find a device with bus info
        '''
        device = find_device_with_bus_info(self.devices, bus_info)
        if not device:
            raise DeviceNotFoundException(bus_info)
        return device
    
    async def _get_devices(self, old_devices: List[DeviceInfo]):
        # enumerate the devices
        devices_info = list_devices()

        # find the new devices
        new_devices = list_diff(devices_info, old_devices)

        # find the removed devices
        removed_devices = list_diff(old_devices, devices_info)

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

            # Output device to log (after loading settings)
            logging.info(f'Device Added: {device_info.bus_info}')

            await self.sio.emit('device_added', DeviceModel.model_validate(device).model_dump())

        while len(self.gst_errors) > 0:
            bus_info = self.gst_errors.pop()
            await self._emit_gst_error(bus_info, 'GST Error')

        # make sure to load the leader followers in case there are new ones to check
        self.settings_manager.load_leader_followers(self.devices)

        # remove the old devices
        for device_info in removed_devices:
            for device in self.devices:
                if device.device_info == device_info:
                    device.stream_runner.stop()
                    if device.device_type == DeviceType.STELLARHD_LEADER:
                        for follower in self.devices:
                            if follower.device_type == DeviceType.STELLARHD_FOLLOWER:
                                # remove the leader if its leader is the removed device
                                # FIXME: This could be cleaner if the leader has a list of followers instead, which it does sorta, but not quite
                                follower_casted = cast(SHDDevice, follower)
                                if follower_casted.leader == device.bus_info:
                                    follower_casted.remove_leader()

                    self.devices.remove(device)
                    logging.info(f'Device Removed: {device_info.bus_info}')

                    await self.sio.emit('device_removed', device_info.bus_info)

        return devices_info

    async def _monitor(self):
        '''
        Internal code to monitor devices for changes
        '''
        devices_info = await self._get_devices([])

        while self._is_monitoring:
            # do not overload the bus
            await asyncio.sleep(0.1)

            # get the list of devices and update the internal array
            devices_info = await self._get_devices(devices_info)

    async def _emit_gst_error(self, device: str, errors: list):
        '''
        Emit a gst_error and make sure it is not due to the device being unplugged
        '''
        devices_info = list_devices()

        for dev_info in devices_info:
            if device == dev_info.bus_info:
                print('logging error')
                await self.sio.emit('gst_error', {'errors': errors, 'bus_info': device})
                return

        logging.info('gst_error ignored due to device unplugged')
