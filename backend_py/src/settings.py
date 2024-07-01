from typing import *
import threading
import time
import json

from .saved_types import *
from .schemas import SavedDeviceSchema
from .device import Device


class SettingsManager:

    def __init__(self) -> None:
        try:
            self.file_object = open('./device_settings.json', 'r+')
        except FileNotFoundError:
            open('./device_settings.json', 'w').close()
            self.file_object = open('./device_settings.json', 'r+')
        self.to_save: List[SavedDevice] = []
        self.thread = threading.Thread(target=self._run_settings_sync)
        self.thread.start()

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
                device.load_settings(saved_device)
                return

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
