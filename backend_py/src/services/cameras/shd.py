"""
shd.py

Adds additional features to stellarHD devices
Uses options functionality to set defaults, ranges, and specifies registers for where these features store data
"""

import logging
import subprocess
from .saved_pydantic_schemas import SavedDeviceModel
from .enumeration import DeviceInfo
from .device import Device, BaseOption, ControlTypeEnum, StreamEncodeTypeEnum
from . import xu_controls as xu
from typing import Dict, List

from event_emitter import EventEmitter


class StellarOption(BaseOption, EventEmitter):
    def __init__(self, name: str, value):
        BaseOption.__init__(self, name)
        EventEmitter.__init__(self)
        self.value = value

    def set_value(self, value):
        self.value = value
        self.emit("value_changed")

    def get_value(self):
        return self.value
    
"""
Stellar Dual Register Class
"""
class DualRegisterOption(StellarOption):
    def __init__(
        self,
        camera,
        high_cmd: xu.Command,
        low_cmd: xu.Command,
        name:str,
        value: int = 0
    ) -> None:
        super().__init__(name, value)

        self._camera = camera
        self.high_reg = high_cmd
        self.low_reg = low_cmd

        self.script_path = "/opt/DWE_Stellar_Control/stellar_control.sh"
        self.logger = logging.getLogger("dwe_os.cameras.DualRegisterOption")

    # grab values from 2 registers and combine them to read
    def get_value(self):
        high_val = self._run_script("read", self._camera.path, self.high_reg)
        if high_val is None:
            return self.value
        low_val = self._run_script("read", self._camera.path, self.low_reg)
        if low_val is None:
            return self.value
        
        try:
            high_val = int(high_val.strip())
            low_val = int(low_val.strip())
            total_val = (high_val << 8) | low_val

            self.value = total_val
            return total_val
        except ValueError:
            return self.value
        
    # split value across 2 registers to set
    def set_value(self, value):
        try:
            inputTotal = int(value)
        except ValueError:
            return

        self.value = inputTotal
        
        high_val = (inputTotal >> 8) & 0xFF
        low_val = inputTotal & 0xFF 
    
        device_path = self._camera.path

        self._run_script("write", device_path, self.high_reg, high_val)
        self._run_script("write", device_path, self.low_reg, low_val)

        self.emit("value_changed")
        

    def _run_script(self, operation, dev_path, register, value=None):
        # create arguements
        register = f"0x{register.value:04x}"
        cmd = [
                self.script_path,
                "--dev", dev_path,
                operation,
                register
            ]
        if operation == "write" and value is not None:
            cmd.append(str(value))

        # run command
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            if operation == "read":
                return result.stdout.strip()
            else:
                self.logger.info(f"Write output: {result.stdout.strip()}")
                return None
        except subprocess.CalledProcessError as e:
            self.logger.error(f"{operation} Failed on {register}: {e.stderr}")
            return None

class SHDDevice(Device):
    """
    Class for stellarHD devices
    """

    def __init__(self, device_info: DeviceInfo) -> None:
        # Specifies if SHD device is Stellar Pro
        self.is_pro = True # self.pid == 0x6369

        super().__init__(device_info)

        # Copy MJPEG over to Software H264, since they are the same thing
        mjpg_camera = self.find_camera_with_format("MJPG")
        mjpg_camera.formats["SOFTWARE_H264"] = mjpg_camera.formats["MJPG"]

        # List of followers
        # Zero inherent truth to the existance of these devices
        self.followers: List[str] = []

        # These exist
        self.follower_devices: List['SHDDevice'] = []

        # Is true if it is managed, false otherwise
        self.is_managed = False

        self.add_control_from_option(
            "bitrate", 5, ControlTypeEnum.INTEGER, 10, 0.1, 0.1
        )

        if self.is_pro:
            self.add_control_from_option(
                'shutter', 100, ControlTypeEnum.INTEGER, 10000, 1, 1
            )

            self.add_control_from_option(
                'iso', 400, ControlTypeEnum.INTEGER, 6400, 100, 100
            )

    def add_follower(self, device: 'SHDDevice'):
        if device.bus_info in self.followers:
            self.logger.info(
                'Trying to add follower to device that already has this device as a follower. Ignoring request.')
            return
        self.logger.info('Adding follower')

        # For saving purposes
        self.followers.append(device.bus_info)

        # This is the real addition
        self.follower_devices.append(device)

        # Make the follower managed
        device.set_is_managed(True)
        # Append the new device stream
        self.stream_runner.streams.append(device.stream)

        if self.stream.enabled:
            self.start_stream()

    def remove_follower(self, device: 'SHDDevice'):
        if not device.bus_info in self.followers:
            self.logger.info(
                "Cannot remove follower from device that does not contain it.")
            return
        # Reconstruct the list without the follower
        self.followers = [
            dev for dev in self.followers if dev != device.bus_info]
        self.follower_devices = [
            dev for dev in self.follower_devices if dev.bus_info != device.bus_info
        ]

        self.stream_runner.streams.remove(device.stream)
        device.set_is_managed(False)

        self.logger.info('Removing follower')

        if self.stream.enabled:
            self.start_stream()

    def remove_manual(self, follower_bus_info: str):
        '''
        This should be called in the case the follower no longer exists
        '''
        self.followers.remove(follower_bus_info)

    def set_is_managed(self, is_managed: bool):
        self.is_managed = is_managed

        # Configure stream if needbe
        if not is_managed:
            if self.stream.enabled:
                self.start_stream()

    def _get_options(self) -> Dict[str, StellarOption]:
        options = {}

        self.bitrate_option = StellarOption(
            "Software H.264 Bitrate", 5)  # 5 mpbs

        def update_bitrate():
            if self.stream.enabled and self.stream.encode_type == StreamEncodeTypeEnum.SOFTWARE_H264:
                self.start_stream()

        # Only restart if it's being used
        self.bitrate_option.on(
            "value_changed",
            update_bitrate,
        )

        options["bitrate"] = self.bitrate_option

        if self.is_pro:
            # UVC shutter speed control
            options['shutter'] = DualRegisterOption(
                self.cameras[0], xu.Command.SHUTTER_COARSE, xu.Command.SHUTTER_FINE, "Shutter Speed")

            # UVC ISO control
            options['iso'] = DualRegisterOption(
                self.cameras[0], xu.Command.ISO_COARSE, xu.Command.ISO_FINE, "ISO")

        return options

    def load_settings(self, saved_device: SavedDeviceModel):
        return super().load_settings(saved_device)

    def start_stream(self):
        if self.is_managed:
            self.logger.warning(
                f"{self.bus_info if not self.nickname else self.nickname}: Cannot start stream that is managed.")
            return

        # mbps to kbit/sec
        self.stream.software_h264_bitrate = int(
            self.bitrate_option.get_value() * 1000
        )

        super().start_stream()

    def unconfigure_stream(self):
        # remove leader when unconfiguring
        if self.leader_device:
            self.remove_leader()
        return super().unconfigure_stream()
