"""
device_manager.py

Handles functionality of device and montiors for devices
When it finds a new device, it creates a new device object and updates the device list and that devices settings
When it sees a missing device, it removes that device ojbect from the device list
Manages a devices streaming state as well as changes to device name
Manages the leader follower connections
"""

from typing import *
import logging
import event_emitter as events
import asyncio
import traceback

from .pydantic_schemas import *
from .device import Device, lookup_pid_vid, DeviceInfo, DeviceType
from .settings import SettingsManager
from .enumeration import list_devices
from .device_utils import list_diff, find_device_with_bus_info
from .exceptions import DeviceNotFoundException
from .stream import StreamRunner

import socketio

from .ehd import EHDDevice
from .shd import SHDDevice


def todict(obj, classkey=None):
    if isinstance(obj, dict):
        data = {}
        for k, v in obj.items():
            data[k] = todict(v, classkey)
        return data
    elif hasattr(obj, "_ast"):
        return todict(obj._ast())
    elif hasattr(obj, "__iter__") and not isinstance(obj, str):
        return [todict(v, classkey) for v in obj]
    elif hasattr(obj, "__dict__"):
        data = dict(
            [
                (key, todict(value, classkey))
                for key, value in obj.__dict__.items()
                if not callable(value) and not key.startswith("_")
            ]
        )
        if classkey is not None and hasattr(obj, "__class__"):
            data[classkey] = obj.__class__.__name__
        return data
    else:
        return obj


class DeviceManager(events.EventEmitter):
    """
    Class for interfacing with and monitoring devices
    """

    def __init__(
        self, sio: socketio.Server, settings_manager=SettingsManager()
    ) -> None:
        self.devices: List[Device] = []
        self.sio = sio
        self.settings_manager = settings_manager
        self._is_monitoring = False
        # List of devices with gstreamer errors
        self.gst_errors: List[str] = []

        self.sync_groups: List[str] = []

        # Each stream runner takes in a sequence of streams metadata stored in the device objects
        self.stream_runners: List[StreamRunner] = []

        self.logger = logging.getLogger("dwe_os_2.cameras.DeviceManager")

    def start_monitoring(self):
        """
        Begin monitoring for devices in the background
        """
        self._is_monitoring = True
        asyncio.create_task(self._monitor())

    def stop_monitoring(self):
        """
        Stop monitoring for devices
        """
        self._is_monitoring = False

        for device in self.devices:
            device.stream.stop()

    def add_to_sync_group(self, bus_info: str, group: str):
        """
        Add a given device to a sync group
        """
        if group not in self.sync_groups:
            self.sync_groups.append(group)

        dev = self._find_device_with_bus_info(bus_info)
        if not dev:
            return False

        if dev.device_type == DeviceType.STELLARHD_LEADER or dev.device_type == DeviceType.STELLARHD_FOLLOWER:
            device: SHDDevice = cast(SHDDevice, dev)
            device.sync_group = group
            self.settings_manager.save_device(device)

        return True

    def create_device(self, device_info: DeviceInfo) -> Device | None:
        """
        Create a new device based on enumerated device info
        """
        (_, device_type) = lookup_pid_vid(device_info.vid, device_info.pid)

        device = None
        match device_type:
            case DeviceType.EXPLOREHD:
                device = EHDDevice(device_info)
            case DeviceType.STELLARHD_LEADER:
                device = SHDDevice(device_info)
            case DeviceType.STELLARHD_FOLLOWER:
                device = SHDDevice(device_info)
            case _:
                # Not a DWE device
                return None

        return device

    def _append_gst_error(self, device: DeviceModel):
        """
        Helper function to append a gst error
        """
        self.sio.emit("gst_error", {
            "errors": self.gst_errors,
            "bus_info": device.bus_info
        })
        device.stream.enabled = False
        self.gst_errors.append(device.bus_info)

    def get_devices(self):
        """
        Compile and sort a list of devices for jsonifcation
        """
        device_list = [DeviceModel.model_validate(
            device) for device in self.devices]
        return device_list

    def set_device_option(
        self, bus_info: str, option: str, option_value: int | bool
    ) -> bool:
        """
        Set a device option
        """
        device = self._find_device_with_bus_info(bus_info)

        device.set_option(option, option_value)

        self.settings_manager.save_device(device)
        return True

    def configure_device_stream(self, stream_info: StreamInfoModel) -> bool:
        """
        Configure a device's stream with the given stream info
        """
        device = self._find_device_with_bus_info(stream_info.bus_info)

        stream_format = stream_info.stream_format
        width: int = stream_format.width
        height: int = stream_format.height
        interval = stream_format.interval
        encode_type: StreamEncodeTypeEnum = stream_info.encode_type
        stream_type: StreamTypeEnum = stream_info.stream_type
        endpoints = stream_info.endpoints

        device.configure_stream(
            encode_type, width, height, interval, stream_type, endpoints
        )

        self.settings_manager.save_device(device)
        return True

    def set_device_nickname(self, bus_info: str, nickname: str) -> bool:
        """
        Set a device nickname
        """
        device = self._find_device_with_bus_info(bus_info)

        self.logger.info(f'Setting nickname of {bus_info} to {nickname}')

        device.nickname = nickname

        self.settings_manager.save_device(device)
        return True

    def set_device_uvc_control(
        self, bus_info: str, control_id: int, control_value: int
    ) -> bool:
        """
        Set a device UVC control
        """
        device = self._find_device_with_bus_info(bus_info)

        device.set_pu(control_id, control_value)

        self.settings_manager.save_device(device)
        return True

    def add_follower(self, leader_bus_info: str, follower_bus_info: str):
        '''
        Add a follower to a leader
        '''
        leader_device = self._find_device_with_bus_info(leader_bus_info)
        follower_device = self._find_device_with_bus_info(follower_bus_info)

        if leader_device.device_type != DeviceType.STELLARHD_LEADER:
            self.logger.warning(
                'Attempted to add follower to device of non-leader type.')
            return False

        if follower_device.device_type != DeviceType.STELLARHD_FOLLOWER:
            self.logger.warning(
                'Attempted to add follower of non-follower type')
            return False

        leader_device = cast(SHDDevice, leader_device)
        follower_device = cast(SHDDevice, follower_device)
        leader_device.add_follower(follower_device)

        self.settings_manager.save_device(leader_device)
        self.settings_manager.save_device(follower_device)

        return True

    def remove_follower(self, leader_bus_info: str, follower_bus_info: str):
        '''
        Remove a follower from a leader
        '''
        leader_device = self._find_device_with_bus_info(leader_bus_info)
        leader_device = cast(SHDDevice, leader_device)
        try:
            follower_device = self._find_device_with_bus_info(
                follower_bus_info)
        except DeviceNotFoundException:
            # THERE IS NO INHERENT TRUTH TO THE EXISTANCE OF THE FOLLOWER
            # Expected in the case of an unplugged follower
            leader_device.remove_manual(follower_bus_info)
            return

        if leader_device.device_type != DeviceType.STELLARHD_LEADER:
            self.logger.warning(
                'Attempted to remove follower from device of non-leader type.')
            return False

        if follower_device.device_type != DeviceType.STELLARHD_FOLLOWER:
            self.logger.warning(
                'Attempted to remove follower of non-follower type')
            return False

        follower_device = cast(SHDDevice, follower_device)
        leader_device.remove_follower(follower_device)

        self.settings_manager.save_device(leader_device)
        self.settings_manager.save_device(follower_device)

        return True

    def _find_device_with_bus_info(self, bus_info: str) -> Device | None:
        if stream_info.enabled:
            device.start_stream()
        else:
            device.stop_stream()
        """
        Utility to find a device with bus info
        """
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
                traceback.print_exc()
                self.logger.warning(e)
                continue
            # append the device to the device list
            self.devices.append(device)
            # load the settings
            self.settings_manager.load_device(device, self.devices)

            # Output device to log (after loading settings)
            self.logger.info(f"Device Added: {device_info.bus_info}")

            await self.sio.emit(
                "device_added", DeviceModel.model_validate(device).model_dump()
            )

        while len(self.gst_errors) > 0:
            bus_info = self.gst_errors.pop()
            await self._emit_gst_error(bus_info, "GST Error")

        # remove the old devices
        for device_info in removed_devices:
            for device in self.devices:
                if device.device_info == device_info:
                    self.devices.remove(device)
                    self.logger.info(f"Device Removed: {device_info.bus_info}")

                    await self.sio.emit("device_removed", device_info.bus_info)

        return devices_info

    async def _monitor(self):
        """
        Internal code to monitor devices for changes
        """
        devices_info = await self._get_devices([])

        while self._is_monitoring:
            # do not overload the bus
            await asyncio.sleep(0.1)

            # get the list of devices and update the internal array
            devices_info = await self._get_devices(devices_info)

    async def _emit_gst_error(self, device: str, errors: list):
        """
        Emit a gst_error and make sure it is not due to the device being unplugged
        """
        devices_info = list_devices()

        for dev_info in devices_info:
            if device == dev_info.bus_info:
                await self.sio.emit("gst_error", {"errors": errors, "bus_info": device})
                return

        self.logger.debug("gst_error ignored due to device unplugged")
