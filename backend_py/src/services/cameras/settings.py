"""
settings.py

Manages persisting camera settings and configs
Handles loading and saving device configs to JSON, keeping setting across reboots, and manages background sync of settings
"""

from typing import List, Dict, cast
import threading
import time
import json
import logging

from .pydantic_schemas import DeviceType
from .saved_pydantic_schemas import SavedDeviceModel, SavedLeaderFollowerPairModel
from .device import Device
from .shd import SHDDevice

from .device_utils import find_device_with_bus_info


class SettingsManager:

    def __init__(self, settings_path: str = ".") -> None:
        path = f"{settings_path}/device_settings.json"
        try:
            self.file_object = open(path, "r+")
        except FileNotFoundError:
            open(path, "w").close()
            self.file_object = open(path, "r+")
        self.to_save: List[SavedDeviceModel] = []
        self.thread = threading.Thread(target=self._run_settings_sync)
        self.thread.start()

        self.leader_follower_pairs: List[SavedLeaderFollowerPairModel] = []

        self.logger = logging.getLogger("dwe_os_2.SettingsManager")

        try:
            settings: list[Dict] = json.loads(self.file_object.read())
            self.settings: List[SavedDeviceModel] = [
                SavedDeviceModel.model_validate(saved_device)
                for saved_device in settings
            ]

            self.saved_by_bus_info: Dict[str, SavedDeviceModel] = {
                dev.bus_info: dev for dev in self.settings
            }
        except json.JSONDecodeError:
            self.file_object.seek(0)
            self.file_object.write("[]")
            self.file_object.truncate()
            self.settings = []
            self.file_object.flush()

    def load_device(self, device: Device, devices: List[Device]):
        for saved_device in self.settings:
            if saved_device.bus_info == device.bus_info:
                if device.device_type != saved_device.device_type:
                    self.logger.info(
                        f"Device {device.bus_info} with device_type: {str(device.device_type)} plugged into port of saved device_type: {str(saved_device.device_type)}. Discarding stored data."
                    )
                    self.settings.remove(saved_device)
                    return

                device.load_settings(saved_device)

                # We plugged in a new leader
                if isinstance(device, SHDDevice):
                    for follower_bus_info in saved_device.followers:
                        follower = find_device_with_bus_info(
                            devices, follower_bus_info)
                        if not follower:
                            self.logger.warning(
                                f"Follower device with bus_info {follower_bus_info} not currently connected"
                            )
                            continue

                        if follower.device_type != DeviceType.STELLARHD_FOLLOWER:
                            self.logger.warning(
                                f"Follower device {follower.bus_info} is not of follower type, skipping"
                            )
                            saved_device.followers.remove(follower_bus_info)
                            continue

                        follower = cast(SHDDevice, follower)
                        device = cast(SHDDevice, device)
                        if follower.is_managed:
                            self.logger.info(
                                f"Saved follower already has a new leader")
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

                        saved_leader = self.saved_by_bus_info.get(
                            potential_leader.bus_info)
                        if not saved_leader:
                            continue

                        if device.bus_info in saved_leader.followers:
                            follower = cast(SHDDevice, device)
                            leader = cast(SHDDevice, potential_leader)
                            leader.add_follower(follower)
                            break  # Only follow one leader

                return

    def link_followers(self, devices: List[Device]):
        '''
        Run this when we need to check for new devices
        '''
        for leader in devices:
            # Changed: We now allow followers to be leaders (of other followers)
            if not isinstance(leader, SHDDevice):
                continue

            leader = cast(SHDDevice, leader)

            saved = self.saved_by_bus_info.get(leader.bus_info)

            # This device has not been saved
            if not saved:
                continue

            for follower_bus_info in saved.followers:
                if follower_bus_info in leader.followers:
                    # Already loaded
                    continue

                follower = find_device_with_bus_info(
                    devices, follower_bus_info)

                # If this follower does not exist, that is ok
                # There is no inherent truth to the existance of the followers list
                if not follower:
                    continue

                # What is worse than it not existing, however, is it not being a follower
                # So, we delete
                if follower.device_type != DeviceType.STELLARHD_FOLLOWER:
                    self.logger.warning(
                        f"Follower device {follower.bus_info} is not of follower type, skipping"
                    )
                    saved.followers.remove(follower_bus_info)
                    continue

                follower = cast(SHDDevice, follower)
                leader.add_follower(follower)

    def _save_device(self, saved_device: SavedDeviceModel):
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

    def _run_settings_sync(self):
        while True:
            for saved_device in self.to_save:
                self._save_device(saved_device)
            self.to_save = []
            time.sleep(1)

    def save_device(self, device: Device):
        # schedule a save command
        self.to_save.append(SavedDeviceModel.model_validate(device))
