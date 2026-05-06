"""
device_manager.py

Handles functionality of device and montiors for devices
When it finds a new device, it creates a new device object and updates the device list
and that devices settings
When it sees a missing device, it removes that device ojbect from the device list
Manages a devices streaming state as well as changes to device name
Manages the leader follower connections
"""

import asyncio
import logging
import traceback
from typing import Any, cast

import event_emitter as events
import socketio

from .device import Device, DeviceInfo, DeviceType, lookup_pid_vid
from .device_utils import find_device_with_bus_info, list_diff
from .ehd import EHDDevice
from .enumeration import list_devices
from .exceptions import DeviceNotFoundException
from .pwm.serial_pwm_controller import SerialPWMController
from .pydantic_schemas import (
    DeviceModel,
    FrameDropStats,
    StreamEncodeTypeEnum,
    StreamInfoModel,
    StreamTypeEnum,
)
from .settings import SettingsManager
from .shd import SHDDevice


def todict(obj, classkey=None) -> Any:
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
        self,
        sio: socketio.AsyncServer,
        settings_manager: SettingsManager,
        serial: SerialPWMController,
    ) -> None:
        self.devices: list[Device] = []
        self.sio = sio
        self.settings_manager = settings_manager
        self._is_monitoring = False
        # List of devices with stream errors
        self.stream_errors: list[str] = []

        self.serial = serial

        self.logger = logging.getLogger("dwe_os_2.cameras.DeviceManager")

        # Captured in start_monitoring
        self._loop: asyncio.AbstractEventLoop | None = None

    def start_monitoring(self) -> None:
        """
        Begin monitoring for devices in the background
        """
        self._is_monitoring = True
        self._loop = asyncio.get_running_loop()
        asyncio.create_task(self._monitor())

    def stop_monitoring(self) -> None:
        """
        Stop monitoring for devices
        """
        self._is_monitoring = False

        for device in self.devices:
            device.stream_runner.stop()
            device.close()

        if self.serial:
            self.serial.close()

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

        # we need to broadcast that there was a gst error so that the frontend knows
        # there may be a kernel issue
        device.stream_runner.on(
            "stream_error",
            lambda _: self._append_stream_error(DeviceModel.model_validate(device)),
        )

        device.on("frame_stats", lambda: self._schedule_emit_frame_stats(device))

        if self.serial:
            device.on("pwm_frequency", lambda fps: self.serial.apply_from_fps(fps))

        return device

    def _append_stream_error(self, device: DeviceModel) -> None:
        """
        Helper function to append a gst error
        """
        device.stream.enabled = False
        self.stream_errors.append(device.bus_info)

    def get_devices(self) -> list[DeviceModel]:
        """
        Compile and sort a list of devices for jsonifcation
        """
        device_list = [DeviceModel.model_validate(device) for device in self.devices]
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

    def set_device_nickname(self, bus_info: str, nickname: str) -> bool:
        """
        Set a device nickname
        """
        device = self._find_device_with_bus_info(bus_info)

        self.logger.info(f"Setting nickname of {bus_info} to {nickname}")

        device.nickname = nickname

        self.settings_manager.save_device(device)
        return True

    def set_device_uvc_control(
        self, bus_info: str, control_id: int, control_value: int | float
    ) -> bool:
        """
        Set a device UVC control
        """
        device = self._find_device_with_bus_info(bus_info)

        device.set_pu(control_id, control_value)

        self.settings_manager.save_device(device)
        return True

    def add_follower(self, leader_bus_info: str, follower_bus_info: str) -> bool:
        """
        Add a follower to a leader
        """
        leader_device = self._find_device_with_bus_info(leader_bus_info)
        follower_device = self._find_device_with_bus_info(follower_bus_info)

        if follower_device.device_type != DeviceType.STELLARHD_FOLLOWER:
            self.logger.warning("Attempted to add follower of non-follower type")
            return False

        leader_device = cast(SHDDevice, leader_device)
        follower_device = cast(SHDDevice, follower_device)
        leader_device.add_follower(follower_device)

        self.settings_manager.save_device(leader_device)
        self.settings_manager.save_device(follower_device)

        return True

    def remove_follower(self, leader_bus_info: str, follower_bus_info: str) -> bool:
        """
        Remove a follower from a leader
        """
        leader_device = self._find_device_with_bus_info(leader_bus_info)
        leader_device = cast(SHDDevice, leader_device)
        try:
            follower_device = self._find_device_with_bus_info(follower_bus_info)
        except DeviceNotFoundException:
            # THERE IS NO INHERENT TRUTH TO THE EXISTANCE OF THE FOLLOWER
            # Expected in the case of an unplugged follower
            leader_device.remove_manual(follower_bus_info)
            return False

        # This is allowed
        # if leader_device.device_type != DeviceType.STELLARHD_LEADER:
        #     self.logger.warning(
        #         'Attempted to remove follower from device of non-leader type.')
        #     return False

        if follower_device.device_type != DeviceType.STELLARHD_FOLLOWER:
            self.logger.warning("Attempted to remove follower of non-follower type")
            return False

        follower_device = cast(SHDDevice, follower_device)
        leader_device.remove_follower(follower_device)

        self.settings_manager.save_device(leader_device)
        self.settings_manager.save_device(follower_device)

        return True

    def _find_device_with_bus_info(self, bus_info: str) -> Device:
        """
        Utility to find a device with bus info
        """
        device = find_device_with_bus_info(self.devices, bus_info)
        if not device:
            raise DeviceNotFoundException(bus_info)
        return device

    async def _get_devices(self, old_devices: list[DeviceInfo]) -> list[DeviceInfo]:
        # enumerate the devices
        devices_info = list_devices()

        # find the new devices
        new_devices = list_diff(devices_info, old_devices)

        # find the removed devices
        removed_devices: list[DeviceInfo] = list_diff(old_devices, devices_info)

        device_added = False

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

            device_added = True

        while len(self.stream_errors) > 0:
            bus_info = self.stream_errors.pop()
            await self._emit_stream_error(bus_info, "Stream Error")

        if len(removed_devices) > 0 or len(new_devices) > 0:
            # make sure to load the leader followers in case there are new ones to check
            self.settings_manager.link_followers(self.devices)

        # remove the old devices
        for device_info in removed_devices:
            removed_device = find_device_with_bus_info(
                self.devices, device_info.bus_info
            )

            if not removed_device:
                continue

            removed_device.stream_runner.stop()

            # What to do when a device is unplugged
            # Remove unplugged followers from leaders, and unplugged leaders
            # as leaders
            if (
                removed_device.device_type == DeviceType.STELLARHD_LEADER
                or removed_device.device_type == DeviceType.STELLARHD_FOLLOWER
            ):
                leader_casted = cast(SHDDevice, removed_device)
                for follower_bus_info in leader_casted.followers:
                    # This can be optimized, but it truly does not matter
                    follower = self._find_device_with_bus_info(follower_bus_info)
                    # Remember, follower might not exist now - never inherent
                    # truth to its existance
                    if follower:
                        follower_casted = cast(SHDDevice, follower)
                        leader_casted.remove_follower(follower_casted)
                        self.settings_manager.save_device(leader_casted)
            if removed_device.device_type == DeviceType.STELLARHD_FOLLOWER:
                follower_casted = cast(SHDDevice, removed_device)
                if follower_casted.is_managed:
                    for device in self.devices:
                        if (
                            device.device_type == DeviceType.STELLARHD_LEADER
                            or device.device_type == DeviceType.STELLARHD_FOLLOWER
                        ):
                            leader_casted = cast(SHDDevice, device)
                            if follower_casted.bus_info in leader_casted.followers:
                                leader_casted.remove_follower(follower_casted)
                                self.settings_manager.save_device(leader_casted)

            self.devices.remove(removed_device)
            self.logger.info(f"Device Removed: {device_info.bus_info}")

            await self.sio.emit("device_removed", device_info.bus_info)

        if device_added:
            # FIXME: Issue where sometimes frontend updates too quickly before the
            # changes have been made
            await self.sio.emit("device_added")

        return devices_info

    def _schedule_emit_frame_stats(self, device: Device) -> None:
        """
        Schedule a frame_stats emit from any thread onto the main asyncio loop.
        """
        loop = self._loop
        if loop is None or loop.is_closed():
            return
        try:
            asyncio.run_coroutine_threadsafe(self._emit_frame_stats(device), loop)
        except RuntimeError:
            return

    async def _emit_frame_stats(self, device: Device) -> None:
        """
        Emit frame stats to the frontend via SocketIO
        """
        # Snapshot under the lock so we don't race with the capture thread's
        # increment or with start_stream's reset.
        # NOTE: This may cause minor perf issues when dropping a lot of frames
        with device._frame_stats_lock:
            frame_stats_payload = device.frame_stats.model_dump()

        # TODO: switch more to use namespace
        await self.sio.emit(
            "device.frame_stats",
            {
                "bus_info": device.bus_info,
                "frame_stats": frame_stats_payload,
            },
        )

    async def _monitor(self) -> None:
        """
        Internal code to monitor devices for changes
        """
        devices_info = await self._get_devices([])

        while self._is_monitoring:
            # do not overload the bus
            await asyncio.sleep(0.1)

            # get the list of devices and update the internal array
            devices_info = await self._get_devices(devices_info)

    async def _emit_stream_error(self, device: str, errors: list | str) -> None:
        """
        Emit a stream_error and make sure it is not due to the device being unplugged
        """
        devices_info = list_devices()

        for dev_info in devices_info:
            if device == dev_info.bus_info:
                await self.sio.emit(
                    "stream_error", {"errors": errors, "bus_info": device}
                )
                return

        self.logger.debug("stream_error ignored due to device unplugged")
