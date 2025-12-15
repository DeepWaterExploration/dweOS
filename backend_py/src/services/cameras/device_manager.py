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

        # we need to broadcast that there was a gst error so that the frontend knows there may be a kernel issue
        device.stream_runner.on(
            "gst_error", lambda _: self._append_gst_error(device))

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

        if stream_info.enabled:
            device.start_stream()
        else:
            device.stop_stream()

        self.settings_manager.save_device(device)
        return True

    # def unconfigure_device_stream(self, bus_info: str) -> bool:
    #     """
    #     Remove a device stream (unconfigure)
    #     """
    #     device = self._find_device_with_bus_info(bus_info)
    #     if not device:
    #         return False

    #     device.unconfigure_stream()

    #     self.settings_manager.save_device(device)

    #     # Remove leader if leader stops stream
    #     if (
    #         device.device_type == DeviceType.STELLARHD_LEADER
    #         and cast(SHDDevice, device).follower
    #     ):
    #         self.remove_leader(cast(SHDDevice, device).follower)
    #     return True

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

        if len(removed_devices) > 0 or len(new_devices) > 0:
            # make sure to load the leader followers in case there are new ones to check
            self.settings_manager.link_followers(self.devices)

        # remove the old devices
        for device_info in removed_devices:
            for device in self.devices:
                if device.device_info == device_info:
                    device.stream_runner.stop()

                    # What to do when a device is unplugged
                    # If it is a leader, just have the followers detatch temporarily
                    # If it is a follower, remove self from the leaders streams
                    # This means we need to handle situations like the following
                    #   Leader gets unplugged and follower gets new leader
                    #   Follower gets unplugged and now there is no inherent truth to the
                    #       existance of a given follower
                    if device.device_type == DeviceType.STELLARHD_LEADER:
                        leader_casted = cast(SHDDevice, device)
                        for follower_bus_info in leader_casted.followers:
                            # This can be optimized, but it truly does not matter
                            follower = self._find_device_with_bus_info(
                                follower_bus_info)
                            # Remember, follower might not exist now - never inherent truth to its existance
                            if follower:
                                follower_casted = cast(SHDDevice, follower)
                                leader_casted.remove_follower(follower_casted)
                    elif device.device_type == DeviceType.STELLARHD_FOLLOWER:
                        follower_casted = cast(SHDDevice, device)
                        if follower_casted.is_managed:
                            # TODO: Fix this
                            for device in self.devices:
                                if device.device_type == DeviceType.STELLARHD_LEADER:
                                    leader_casted = cast(SHDDevice, device)
                                    if follower_casted.bus_info in leader_casted.followers:
                                        leader_casted.stream_runner.streams.remove(
                                            follower_casted.stream)
                                        leader_casted.stream_runner.start()

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
