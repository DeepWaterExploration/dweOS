from typing import *
import threading
import time
import json
import logging

from .saved_types import *
from .schemas import SavedDeviceSchema
from .device import Device
from .shd import SHDDevice
from .camera_types import DeviceType

from .device_utils import find_device_with_bus_info

class SettingsManager:

    def __init__(self, settings_path: str = '.') -> None:
        path = f'{settings_path}/device_settings.json'
        try:
            self.file_object = open(path, 'r+')
        except FileNotFoundError:
            open(path, 'w').close()
            self.file_object = open(path, 'r+')
        self.to_save: List[SavedDevice] = []
        self.thread = threading.Thread(target=self._run_settings_sync)
        self.thread.start()

        self.leader_follower_pairs: List[SavedLeaderFollowerPair] = []

        try:
            settings: list[Dict] = json.loads(self.file_object.read())
            self.settings: List[SavedDevice] = SavedDeviceSchema(
                many=True).load(settings)
        except json.JSONDecodeError:
            self.file_object.seek(0)
            self.file_object.write('[]')
            self.file_object.truncate()
            self.settings = []
            self.file_object.flush()

    def load_device(self, device: Device):
        for saved_device in self.settings:
            if saved_device.bus_info == device.bus_info:
                if device.device_type != saved_device.device_type:
                    logging.info(f'Device {device.bus_info} with device_type: {device.device_type} plugged into port of saved device_type: {saved_device.device_type}.\
                                  Discarding stored data as this could cause numerous issues.')
                    self.settings.remove(saved_device)
                    return
                if saved_device.device_type == DeviceType.STELLARHD_FOLLOWER:
                    if not saved_device.is_leader:
                        if saved_device.leader:
                            self.leader_follower_pairs.append(SavedLeaderFollowerPair(saved_device.leader, saved_device.bus_info))

                device.load_settings(saved_device)
                return

    def load_leader_followers(self, devices: List[Device]):
        # TODO: make this code maybe in another class or something, but it works for now and it is clean enough
        # If a follower is plugged in and the leader is not attached yet, wait until it is attached to do anything
        # If a follower is plugged in and the leader is not a stellar leader, remove the leader information
        for leader_follower_pair in self.leader_follower_pairs:
            leader = find_device_with_bus_info(devices, leader_follower_pair.leader_bus_info)
            follower = find_device_with_bus_info(devices, leader_follower_pair.follower_bus_info)

            if not leader or not follower:
                logging.warn(f'Error finding devices: {leader_follower_pair.leader_bus_info}, {leader_follower_pair.follower_bus_info}')
                continue

            if follower.device_type != DeviceType.STELLARHD_FOLLOWER:
                # wrong device type plugged in
                logging.error('This should never ever happen, but is ok and will be managed by the software.')
                self.leader_follower_pairs.remove(leader_follower_pair)
                continue

            # cast the type
            follower = cast(SHDDevice, follower)

            if leader.device_type != DeviceType.STELLARHD_LEADER:
                logging.info('Non leader device plugged into leader port. This is ok and will be managed by the software!')
                self.leader_follower_pairs.remove(leader_follower_pair)
                continue

            leader = cast(SHDDevice, leader)

            # set the leader
            follower.set_leader(leader)

            # The leader follower pair has been used and everything is good
            self.leader_follower_pairs.remove(leader_follower_pair)

    def _save_device(self, saved_device: SavedDevice):
        for dev in self.settings:
            if dev.bus_info == saved_device.bus_info:
                self.settings.remove(dev)
                break
        self.settings.append(saved_device)
        self.file_object.seek(0)
        self.file_object.write(
            json.dumps(SavedDeviceSchema(many=True).dump(self.settings)))
        self.file_object.truncate()
        self.file_object.flush()

    def _run_settings_sync(self):
        while True:
            for saved_device in self.to_save:
                self._save_device(saved_device)
            self.to_save = []
            time.sleep(1)

    def save_device(self, device: Device):
        saved_device = SavedDeviceSchema().load(SavedDeviceSchema().dump(device))
        # schedule a save command
        self.to_save.append(saved_device)
