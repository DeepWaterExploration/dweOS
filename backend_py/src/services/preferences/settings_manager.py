"""
settings.py

Manages persisting camera settings and configs
Handles loading and saving device configs to JSON, keeping setting across reboots,
and manages background sync of settings
"""

import json
import logging
import threading
from typing import cast

from backend_py.src.models import (
    DeviceType,
    SavedDeviceModel,
    SavedLeaderFollowerPairModel,
)

from ..cameras.device_utils import find_device_with_bus_info
from ..cameras.drivers.device import Device
from ..cameras.drivers.shd import SHDDevice


class SettingsManager:
    def __init__(self, settings_path: str = ".") -> None:
        path = f"{settings_path}/device_settings.json"
        try:
            self.file_object = open(path, "r+")  # noqa: SIM115
        except FileNotFoundError:
            open(path, "w").close()
            self.file_object = open(path, "r+")  # noqa: SIM115

        self._lock = threading.Lock()

        self.leader_follower_pairs: list[SavedLeaderFollowerPairModel] = []

        self.logger = logging.getLogger("dwe_os_2.SettingsManager")

        try:
            settings: list[dict] = json.loads(self.file_object.read())
            self.settings: list[SavedDeviceModel] = [
                SavedDeviceModel.model_validate(saved_device)
                for saved_device in settings
            ]

            self.saved_by_bus_info: dict[str, SavedDeviceModel] = {
                dev.bus_info: dev for dev in self.settings
            }
        except json.JSONDecodeError:
            self.file_object.seek(0)
            self.file_object.write("[]")
            self.file_object.truncate()
            self.saved_by_bus_info = {}
            self.settings = []
            self.file_object.flush()

    def cleanup(self) -> None:
        if self.file_object:
            self.file_object.close()

    def _load_device(
        self, device: Device, saved_device: SavedDeviceModel, devices: list[Device]
    ) -> None:
        if device.device_type != saved_device.device_type:
            self.logger.info(
                f"Device {device.bus_info} with device_type: "
                f"{str(device.device_type)} plugged into port of saved "
                f"device_type: {str(saved_device.device_type)}. "
                "Discarding stored data."
            )
            self.settings.remove(saved_device)
            return

        device.load_settings(saved_device)

        # We plugged in a new leader
        if isinstance(device, SHDDevice) and saved_device.followers:
            for follower_bus_info in saved_device.followers:
                follower = find_device_with_bus_info(devices, follower_bus_info)
                if not follower:
                    self.logger.warning(
                        f"Follower device with bus_info {follower_bus_info} "
                        "not currently connected"
                    )
                    continue

                if follower.device_type != DeviceType.STELLARHD_FOLLOWER:
                    self.logger.warning(
                        f"Follower device {follower.bus_info} is not of "
                        "follower type, skipping"
                    )
                    saved_device.followers.remove(follower_bus_info)
                    continue

                follower = cast(SHDDevice, follower)
                if follower.is_managed:
                    self.logger.info("Saved follower already has a new leader")
                    # This is true when the follower has now gotten a new leader
                    saved_device.followers.remove(follower_bus_info)
                    continue
                device.add_follower(follower)

        # We plugged in a new follower
        if device.device_type == DeviceType.STELLARHD_FOLLOWER:
            for potential_leader in devices:
                # Skip if the potential leader is not an SHDDevice (cannot lead)
                if not isinstance(potential_leader, SHDDevice):
                    continue

                # Don't try to follow yourself
                # Though this should also be checked elsewhere, why not :shrug:
                if potential_leader.bus_info == device.bus_info:
                    continue

                saved_leader = self.saved_by_bus_info.get(potential_leader.bus_info)
                if not saved_leader or not saved_leader.followers:
                    continue

                if device.bus_info in saved_leader.followers:
                    follower = cast(SHDDevice, device)
                    potential_leader.add_follower(follower)
                    break  # Only follow one leader

    def load_device(self, device: Device, devices: list[Device]) -> None:
        with self._lock:
            for saved_device in self.settings:
                if saved_device.bus_info == device.bus_info:
                    self._load_device(device, saved_device, devices)
                    return

    def link_followers(self, devices: list[Device]) -> None:
        """
        Run this when we need to check for new devices
        """
        for leader in devices:
            # Changed: We now allow followers to be leaders (of other followers)
            if not isinstance(leader, SHDDevice):
                continue

            saved = self.saved_by_bus_info.get(leader.bus_info)

            # This device has not been saved
            if not saved or not saved.followers:
                continue

            for follower_bus_info in saved.followers:
                if follower_bus_info in leader.followers:
                    # Already loaded
                    continue

                follower = find_device_with_bus_info(devices, follower_bus_info)

                # If this follower does not exist, that is ok
                # There is no inherent truth to the existance of the followers list
                if not follower:
                    continue

                # What is worse than it not existing, however, is it not being a
                # follower. So, we delete
                if follower.device_type != DeviceType.STELLARHD_FOLLOWER:
                    self.logger.warning(
                        f"Follower device {follower.bus_info} is not of follower type, "
                        "skipping"
                    )
                    saved.followers.remove(follower_bus_info)
                    continue

                follower = cast(SHDDevice, follower)
                leader.add_follower(follower)

    def save_device(self, device: Device) -> None:
        saved_device = SavedDeviceModel.model_validate(device)

        with self._lock:
            for dev in self.settings:
                if dev.bus_info == saved_device.bus_info:
                    self.settings.remove(dev)
                    break
            self.settings.append(saved_device)
            self.file_object.seek(0)
            self.file_object.write(
                json.dumps([model.model_dump() for model in self.settings])
            )
            self.file_object.truncate()
            self.file_object.flush()
