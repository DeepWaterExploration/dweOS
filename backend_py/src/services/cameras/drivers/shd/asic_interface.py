"""
asic_interface.py

Defines low level read/write functions to interact with the SHD ASIC and
sensor registers.
"""

import struct
import threading

from ..video4linux import Camera
from ..xu import Selector, StellarRegisterMap, Unit


class ASICInterface:
    """
    Class for low level read/write functions to interact with the SHD ASIC and
    sensor registers.
    """

    def __init__(self, camera: Camera) -> None:
        self.camera = camera
        self._lock = threading.RLock()

    def asic_write(self, addr: int, data: int, dummy: bool = False) -> int:
        """
        Write a value to an ASIC register.
        """
        with self._lock:
            unit = Unit.SYS_ID
            selector = Selector.SYS_ASIC_RW
            size = 4

            # Dummy writes are used for asic reading
            write_mode = 0xFF if dummy else 0
            # Little endian unsigned short (asic address), byte (data),
            # byte (write mode: 0 = normal, 0xFF = dummy)
            ctrl_data = struct.pack("<HBB", addr, data, write_mode)

            return self.camera.uvc_set_ctrl(unit.value, selector.value, ctrl_data, size)

    def asic_read(self, addr: int) -> tuple[int, int]:
        """
        Read a value from an ASIC register.

        Returns 0 on success, along with the value read. (ioctl style)
        On failure, returns a non-zero error code and -1 as the value.
        """
        with self._lock:
            # perform a dummy write to select the correct address
            ret = self.asic_write(addr, 0, True)
            if ret != 0:
                return (ret, -1)

            unit = Unit.SYS_ID
            selector = Selector.SYS_ASIC_RW
            size = 4

            # address, data, dummy read
            ctrl_data = struct.pack("<HBB", addr, 0, 0)

            ret = self.camera.uvc_get_ctrl(unit.value, selector.value, ctrl_data, size)

            val = ctrl_data[2]
            return (ret, val)

    def asic_write_high_low(self, addr_high: int, addr_low: int, value: int) -> None:
        val_low = value & 0xFF
        # TODO: return after first fails... (we dont even use the status anyway)
        _ret = self.asic_write(addr_low, val_low)

        val_high = value >> 8 & 0xFF
        _ret = self.asic_write(addr_high, val_high)

    def asic_read_high_low(
        self,
        addr_high: int,
        addr_low: int,
    ) -> int | None:
        ret, val_high = self.asic_read(addr_high)
        ret, val_low = self.asic_read(addr_low)
        if ret != 0:
            return None
        return val_high << 8 | val_low

    def sensor_write(self, reg: int, val: int) -> int:
        """
        Write a value to a sensor register.
        """

        with self._lock:
            high = (reg >> 8) & 0xFF
            low = reg & 0xFF

            ret = 0

            # Set address high
            ret |= self.asic_write(StellarRegisterMap.REG_ADDR_H, high)
            # Set address low
            ret |= self.asic_write(StellarRegisterMap.REG_ADDR_L, low)
            # Set data
            ret |= self.asic_write(StellarRegisterMap.REG_DATA, val)
            # Set mode to write ('W' = 0x57)
            ret |= self.asic_write(StellarRegisterMap.REG_MODE, 0x57)
            # Trigger the command (0x55)
            ret |= self.asic_write(StellarRegisterMap.REG_TRIG, 0x55)

            return ret

    def sensor_read(self, reg: int) -> tuple[int, int]:
        """
        Read a value from the sensor.

        Returns 0 on success, along with the value read. (ioctl style)
        On failure, returns a non-zero error code and -1 as the value.
        """
        high = (reg >> 8) & 0xFF
        low = reg & 0xFF

        ret = 0

        # Set address high
        ret |= self.asic_write(StellarRegisterMap.REG_ADDR_H, high)
        # Set address low
        ret |= self.asic_write(StellarRegisterMap.REG_ADDR_L, low)
        # Set mode to write ('R' = 0x52)
        ret |= self.asic_write(StellarRegisterMap.REG_MODE, 0x52)
        # Trigger the command (0x55)
        ret |= self.asic_write(StellarRegisterMap.REG_TRIG, 0x55)

        if ret != 0:
            return ret, -1

        ret, val = self.asic_read(StellarRegisterMap.REG_DATA)

        return ret, val

    def sensor_write_high_low(self, reg_high: int, reg_low: int, value: int) -> None:
        """
        Write high byte from value to high register, low byte to low
        """
        self.sensor_write(reg_high, (value >> 8) & 0xFF)
        # This is extremely scuffed: switch to waiting for
        # trigger register before release (See below)
        # time.sleep(0.1)

        # Maybe: add check for success (0xAA in REG_TRIG)
        # REG_TRIG actually seems to not work properly, so maybe
        # we find another alternative
        self.sensor_write(reg_low, value & 0xFF)

    def sensor_read_high_low(self, reg_high, reg_low) -> int | None:
        """
        Read high byte from high register to value, low byte to low
        """
        ret, high = self.sensor_read(reg_high)
        if ret != 0:
            return None
        ret, low = self.sensor_read(reg_low)
        if ret != 0:
            return None

        return (high << 8) | (low & 0xFF)
