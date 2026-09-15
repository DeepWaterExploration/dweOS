"""
settings.py

Manages persisting camera settings and configs
Handles loading and saving device configs to JSON, keeping setting across reboots,
and manages background sync of settings
"""

import json
import logging
import threading

from backend_py.src.models import (
    SavedDeviceModel,
)

from ..cameras.drivers.device import Device


class SettingsManager:
    def __init__(self, settings_path: str = ".") -> None:
        path = f"{settings_path}/device_settings.json"
        try:
            self.file_object = open(path, "r+")  # noqa: SIM115
        except FileNotFoundError:
            open(path, "w").close()
            self.file_object = open(path, "r+")  # noqa: SIM115

        # NOTE: not sure if RLock is the correct change to make,
        # Lock might work fine here
        self._lock = threading.RLock()

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
        self, device: Device, saved_device: SavedDeviceModel, devices: dict[str, Device]
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

    def load_device(self, device: Device, devices: dict[str, Device]) -> None:
        with self._lock:
            for saved_device in self.settings:
                if saved_device.bus_info == device.bus_info:
                    self._load_device(device, saved_device, devices)
                    return

    def get_saved_device(self, bus_info: str) -> SavedDeviceModel | None:
        for saved_device in self.settings:
            if saved_device.bus_info == bus_info:
                return saved_device
        return None

    def _update_settings(self) -> None:
        self.file_object.seek(0)
        # FIXME: remove indent when we are done testing settings
        # (switch to dev mode only)
        self.file_object.write(
            json.dumps([model.model_dump() for model in self.settings], indent=4)
        )
        self.file_object.truncate()
        self.file_object.flush()

    def _save_device(self, saved_device: SavedDeviceModel) -> None:
        # self.logger.debug(f"Saving device: {saved_device.bus_info}")

        with self._lock:
            # Semi scuffed
            for dev in self.settings:
                if dev.bus_info == saved_device.bus_info:
                    self.settings.remove(dev)
                    break
            self.settings.append(saved_device)
            self._update_settings()

    def save_device(self, device: Device) -> None:
        saved_device = SavedDeviceModel.model_validate(device)
        self._save_device(saved_device)
