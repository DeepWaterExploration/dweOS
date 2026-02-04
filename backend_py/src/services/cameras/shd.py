"""
shd.py

Adds additional features to stellarHD devices
"""

import struct
import time
from event_emitter import EventEmitter
from typing import Dict, List

from .saved_pydantic_schemas import SavedDeviceModel
from .enumeration import DeviceInfo
from .device import Device, BaseOption, ControlTypeEnum, StreamEncodeTypeEnum
from . import xu_controls as xu
from typing import Callable, Any

import queue
import collections
import threading
from typing import Optional


class StorageOption(BaseOption, EventEmitter):
    def __init__(self, name: str, value):
        BaseOption.__init__(self, name)
        EventEmitter.__init__(self)
        self.value = value

    def set_value(self, value):
        self.value = value
        self.emit("value_changed")

    def get_value(self):
        return self.value


class CustomOption(BaseOption):

    def __init__(self, name: str, setter: Callable[[Any], None], getter: Callable[[], Any]):
        BaseOption.__init__(self, name)
        self.setter = setter

        # FIXME: I did this since the getter seems to be unreliable for asic controls, so we just trust the value stored
        self.getter = getter
        self.value = getter()

    def set_value(self, value):
        self.setter(value)
        self.value = value

    def get_value(self):
        return self.value


class SHDDevice(Device):
    """
    Class for stellarHD devices
    """

    ASIC_COMMAND_DELAY=0.001

    def __init__(self, device_info: DeviceInfo) -> None:
        # Specifies if SHD device is Stellar Pro
        self.is_pro = True  # self.pid == 0x6369

        self._command_queue = collections.deque()
        self._queue_lock = threading.Lock()
        self._queue_cond = threading.Condition(self._queue_lock)

        self._asic_worker_running = True
        self._asic_thread = threading.Thread(target=self._asic_command_worker, daemon=True)
        self._asic_thread.start()

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
                'shutter', 100, ControlTypeEnum.INTEGER, 8000, 10, 1
            )

            self.add_control_from_option(
                'ae', False, ControlTypeEnum.BOOLEAN
            )

            self.add_control_from_option(
                'iso', 400, ControlTypeEnum.INTEGER, 4095, 0, 1
            )

            self.add_control_from_option(
                'strobe_width', 0, ControlTypeEnum.INTEGER, 4095, 0, 1)

            # self.add_control_from_option(
            #     'strobe_enabled', False, ControlTypeEnum.BOOLEAN)

    def _asic_command_worker(self):
        '''
        Background worker that processes ASIC/Sensor commands sequentionally
        '''
        while self._asic_worker_running:
            task = None
            
            with self._queue_cond:
                # Wait for work
                while not self._command_queue and self._asic_worker_running:
                    self._queue_cond.wait()
                
                if not self._asic_worker_running:
                    break
                
                # Get the next task
                task = self._command_queue.popleft()
            
            if task:
                key, func, args, result_queue = task
                try:
                    res = func(*args)
                    if result_queue:
                        result_queue.put(res)
                except Exception as e:
                    self.logger.error(f"Error executing ASIC command ({key}): {e}")
                    if result_queue:
                        result_queue.put(None)
                
                # Enforce hardware delay
                time.sleep(self.ASIC_COMMAND_DELAY)

    def _run_asic_command(self, key: Optional[str], func: Callable, args: tuple, wait: bool = True) -> Any:
        """
        Helper to submit a command to the queue and wait for the result synchronously.
        """
        if not self._asic_worker_running:
            return None

        result_queue = queue.Queue() if wait else None
        
        with self._queue_cond:
            if key is not None:
                # Filter out previous pending commands of the same type
                # This implements the "ignore previous requests" logic
                # We rebuild the deque without the matching keys
                
                # Check if we even need to filter to avoid list overhead
                if any(item[0] == key for item in self._command_queue):
                    # Filter existing items. 
                    # Note: We only drop items that don't have a result_queue waiting 
                    # (though in this design, keyed items are usually fire-and-forget writes)
                    new_queue = collections.deque()
                    while self._command_queue:
                        item = self._command_queue.popleft()
                        existing_key, _, _, existing_result_q = item
                        
                        # If keys match, we drop the OLD one.
                        # Ideally, we only drop if no one is waiting on it (wait=False).
                        # If wait=True, we probably shouldn't drop it, or we should send None to the queue.
                        if existing_key == key:
                            if existing_result_q:
                                # If something was waiting on the old command, release it
                                existing_result_q.put(None) 
                            # Item is dropped
                            continue
                        
                        new_queue.append(item)
                    self._command_queue = new_queue

            # Add the new command to the end
            self._command_queue.append((key, func, args, result_queue))
            self._queue_cond.notify()

        if wait:
            return result_queue.get()
        return None

    def add_follower(self, device: 'SHDDevice'):
        if device.bus_info in self.followers:
            self.logger.info(
                'Trying to add follower to device that already has this device as a follower. Ignoring request.')
            return

        if device.bus_info == self.bus_info:
            self.logger.info(
                'Trying to add follower of same bus id as self. This is not allowed.')
            return

        self.logger.info('Adding follower')

        # For saving purposes
        self.followers.append(device.bus_info)

        # This is the real addition
        self.follower_devices.append(device)

        # Make the follower managed
        device.set_is_managed(True)

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

        device.set_is_managed(False)

        self.logger.info('Removing follower')

        if self.stream.enabled:
            self.start_stream()

    # ASIC stuff
    # Sensor writes are not supported by all firmwares
    # Only recent stellarHD firmware, no exploreHD firmware - but explore does support asic writes as well

    def _sensor_write_high_low(self, reg_high: int, reg_low: int, value: int):
        '''
        Write high byte from value to high register, low byte to low
        '''
        self._sensor_write(reg_high,
                           (value >> 8) & 0xFF)
        # This is extremely scuffed: switch to waiting for trigger register before release (See below)
        time.sleep(0.1)
        self._sensor_write(reg_low, value & 0xFF)

        # TODO: add check for success (0xAA in REG_TRIG)

    def _sensor_read_high_low(self, reg_high, reg_low) -> int | None:
        '''
        Read high byte from high register to value, low byte to low
        '''
        ret, high = self._sensor_read(reg_high)
        if ret != 0:
            return None
        ret, low = self._sensor_read(reg_low)
        if ret != 0:
            return None

        return (high << 8) | (low & 0xFF)

    def _sensor_write(self, reg: int, val: int):
        high = (reg >> 8) & 0xFF
        low = reg & 0xFF

        ret = 0

        # # Disable auto exposure
        # ret |= self._asic_write(xu.StellarRegisterMap.REG_AE, 0x00)
        # Set address high
        ret |= self._asic_write(xu.StellarRegisterMap.REG_ADDR_H, high)
        # Set address low
        ret |= self._asic_write(xu.StellarRegisterMap.REG_ADDR_L, low)
        # Set data
        ret |= self._asic_write(xu.StellarRegisterMap.REG_DATA, val)
        # Set mode to write ('W' = 0x57)
        ret |= self._asic_write(xu.StellarRegisterMap.REG_MODE, 0x57)
        # Trigger the command (0x55)
        ret |= self._asic_write(xu.StellarRegisterMap.REG_TRIG, 0x55)

        return ret

    def _sensor_read(self, reg: int):
        high = (reg >> 8) & 0xFF
        low = reg & 0xFF

        ret = 0

        # # Disable auto exposure
        # ret |= self._asic_write(xu.StellarRegisterMap.REG_AE, 0x00)
        # Set address high
        ret |= self._asic_write(xu.StellarRegisterMap.REG_ADDR_H, high)
        # Set address low
        ret |= self._asic_write(xu.StellarRegisterMap.REG_ADDR_L, low)
        # Set mode to write ('R' = 0x52)
        ret |= self._asic_write(xu.StellarRegisterMap.REG_MODE, 0x52)
        # Trigger the command (0x55)
        ret |= self._asic_write(xu.StellarRegisterMap.REG_TRIG, 0x55)

        if ret != 0:
            return ret

        ret, val = self._asic_read(xu.StellarRegisterMap.REG_DATA)

        return ret, val

    def _asic_write(self, addr: int | xu.StellarRegisterMap, data: int, dummy: bool = False) -> int:
        unit = xu.Unit.SYS_ID
        selector = xu.Selector.SYS_ASIC_RW
        # Accept enum
        addr_val = addr.value if hasattr(addr, 'value') else addr
        size = 4

        # Dummy writes are used for asic reading
        write_mode = 0xFF if dummy else 0
        # Little endian unsigned short (asic address), byte (data), byte (write mode: 0 = normal, 0xFF = dummy)
        ctrl_data = struct.pack("<HBB", addr_val, data, write_mode)

        return self.cameras[0].uvc_set_ctrl(unit.value, selector.value, ctrl_data, size)

    def _asic_read(self, addr: int | xu.StellarRegisterMap) -> tuple[int, int]:
        addr_val = addr.value if hasattr(addr, 'value') else addr

        # perform a dummy write to select the correct address
        ret = self._asic_write(addr_val, 0, True)
        if ret != 0:
            return ret

        unit = xu.Unit.SYS_ID
        selector = xu.Selector.SYS_ASIC_RW
        size = 4

        # address, data, dummy read
        ctrl_data = struct.pack("<HBB", addr_val, 0, 0)

        ret = self.cameras[0].uvc_get_ctrl(
            unit.value, selector.value, ctrl_data, size)

        val = ctrl_data[2]
        return (ret, val)

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

    # This goes against the architecture created in the exploreHD
    # When we designed that, it was preferred to not have any functions that could control asic values.
    # TODO: FIXME
    def set_shutter_speed(self, value: int):
        self._run_asic_command('shutter', self._sensor_write_high_low,
            (xu.StellarSensorMap.SHUTTER_HIGH, xu.StellarSensorMap.SHUTTER_LOW, value), wait=False)

    def get_shutter_speed(self) -> int | None:
        return self._run_asic_command(None, self._sensor_read_high_low,
            (xu.StellarSensorMap.SHUTTER_HIGH, xu.StellarSensorMap.SHUTTER_LOW), wait=True)

    def set_iso(self, value: int):
        self._run_asic_command('iso', self._sensor_write_high_low,
            (xu.StellarSensorMap.ISO_HIGH, xu.StellarSensorMap.ISO_LOW, value), wait=False)

    def get_iso(self) -> int | None:
        return self._run_asic_command(None, self._sensor_read_high_low,
            (xu.StellarSensorMap.ISO_HIGH, xu.StellarSensorMap.ISO_LOW), wait=True)

    def set_asic_ae(self, enabled: bool):
        self._run_asic_command('ae', self._asic_write, 
                               (xu.StellarRegisterMap.REG_AE, 0x01 if enabled else 0x00), wait=False)

    def get_asic_ae(self) -> bool | None:
        # We can run asic read commands without worrying, since they don't write to the camera..? I think
        ret, val = self._asic_read(xu.StellarRegisterMap.REG_AE)
        if ret != 0:
            return None
        return True if val == 0x01 else False

    def set_strobe_width(self, value: int):
        self._run_asic_command('strobe', self._sensor_write_high_low,
            (xu.StellarSensorMap.STROBE_WIDTH_HIGH, xu.StellarSensorMap.STROBE_WIDTH_LOW, value), wait=False)

    def get_strobe_width(self) -> int | None:
        return self._run_asic_command(None, self._sensor_read_high_low, 
                                      (xu.StellarSensorMap.STROBE_WIDTH_HIGH, xu.StellarSensorMap.STROBE_WIDTH_LOW), wait=True)

    def _get_options(self) -> Dict[str, BaseOption]:
        options = {}

        self.bitrate_option = StorageOption(
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
            options['ae'] = CustomOption(
                "Auto Exposure (ASIC)", self.set_asic_ae, self.get_asic_ae
            )

            # UVC shutter speed control
            options['shutter'] = CustomOption(
                "Shutter Speed", self.set_shutter_speed, self.get_shutter_speed)

            # UVC ISO control
            options['iso'] = CustomOption(
                "ISO", self.set_iso, self.get_iso)

            # options['strobe_enabled'] = CustomOption(
            #     "Strobe Enabled", self.set_strobe_enabled, self.get_strobe_enabled)

            options['strobe_width'] = CustomOption(
                "Strobe Width", self.set_strobe_width, self.get_strobe_width)

        return options

    def load_settings(self, saved_device: SavedDeviceModel):
        return super().load_settings(saved_device)

    def start_stream(self):
        if self.is_managed:
            self.logger.warning(
                f"{self.bus_info if not self.nickname else self.nickname}: Cannot start stream that is managed.")
            return

        self.stream_runner.streams = [self.stream]

        for follower_device in self.follower_devices:
            # A not so hacky fix (very clever :]) to ensure the stream's device_path is set
            follower_device.configure_stream(self.stream.encode_type, self.stream.width,
                                             self.stream.height, self.stream.interval, self.stream.stream_type, [])

            # Append the new device stream
            self.stream_runner.streams.append(follower_device.stream)

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
