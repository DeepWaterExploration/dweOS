"""
asic_interface.py

Defines low level read/write functions to interact with the SHD ASIC and
sensor registers.
"""

import ctypes
import logging
import struct
import threading
import time
from collections.abc import Callable
from dataclasses import dataclass
from enum import Enum

from .video4linux import Camera
from .xu import Selector, StellarRegisterMap, StellarSensorMap, Unit


@dataclass
class ASICCommand:
    func: Callable
    args: list


class DeviceFamily(Enum):
    EXPLOREHD = "EXPLOREHD"
    STELLARHD = "STELLARHD"


CHIP_ID_DEVICE_MAP = {0x86: DeviceFamily.STELLARHD, 0x92: DeviceFamily.EXPLOREHD}

# Firmware sensor I2C command (XU unit 3, selector 2). Fixed 64-byte payload:
#   [0]  slave id (8-bit write address)
#   [1]  register address byte count (1 or 2)
#   [2]  address bytes + data bytes (in a read reply: data bytes read, 0 = NACK)
#   [3:] register address big-endian, then write data (read reply: the data)
#   [63] 0x00 = write, 0xFF = read
# A read is a SET_CUR of the request followed by a GET_CUR of the reply.
SENSOR_I2C_LEN = 64
SENSOR_I2C_HEADER = 3
SENSOR_I2C_FLAG = 63
SENSOR_I2C_READ = 0xFF
SENSOR_I2C_WRITE = 0x00
SENSOR_ADDR_BYTES = 2
SENSOR_I2C_MAX_DATA = SENSOR_I2C_FLAG - SENSOR_I2C_HEADER - SENSOR_ADDR_BYTES
DEFAULT_SENSOR_SLAVE_ID = 0x60


class ASICInterface:
    """
    Class for low level read/write functions to interact with the SHD ASIC and
    sensor registers.
    """

    def __init__(self, camera: Camera) -> None:
        self.camera = camera
        self._lock = threading.RLock()

        self._is_worker_running = True
        self._commands: dict[str, ASICCommand] = {}
        self._queue_lock = threading.Lock()
        self._queue_cond = threading.Condition(self._queue_lock)

        self.logger = logging.getLogger(
            f"dwe_os_2.cameras.shd.ASICInterface.{camera.path}"
        )

        self._is_disabled = False

        self._thread = threading.Thread(target=self._sync_sync_asic_writes, daemon=True)
        self._thread.start()

        self.chip_id = self._get_chip_id()
        self.device_family = None
        if not self.chip_id:
            self.logger.error("Unable to read chip ID, device may be faulty")
        else:
            self.device_family = CHIP_ID_DEVICE_MAP.get(self.chip_id)

        self.sensor_slave_id = DEFAULT_SENSOR_SLAVE_ID
        if self.device_family == DeviceFamily.STELLARHD:
            ret, slave_id = self.asic_read(StellarRegisterMap.REG_SENSOR_SLAVE_ID)
            if ret == 0 and slave_id not in (0x00, 0xFF):
                self.sensor_slave_id = slave_id
            else:
                self.logger.warning(
                    "Unable to read sensor slave id, defaulting to 0x%02X",
                    DEFAULT_SENSOR_SLAVE_ID,
                )

    def stop(self) -> None:
        self.logger.info("Stopping asic interface")
        if self._thread:
            with self._queue_cond:
                self._is_worker_running = False
                self._commands = {}
                self._queue_cond.notify_all()
            self._thread.join()
        self.logger.info("Stopped asic interface")

    def _sync_sync_asic_writes(self) -> None:
        while self._is_worker_running:
            with self._queue_cond:
                while not self._commands and self._is_worker_running:
                    self._queue_cond.wait()

                tasks_to_run = self._commands
                self._commands = {}

            for _key, task in tasks_to_run.items():
                try:
                    task.func(*task.args)
                except Exception:
                    self.logger.exception("Task %s failed", _key)

    def queue_command(self, key: str, func: Callable, args: list) -> None:
        with self._queue_cond:
            self._commands[key] = ASICCommand(func, args)
            self._queue_cond.notify()

    def asic_write(self, key: str, addr: int, data: int) -> None:
        self.queue_command(key, self.sync_asic_write, [addr, data])

    def asic_write_high_low(
        self, key: str, addr_high: int, addr_low: int, value: int
    ) -> None:
        self.queue_command(
            key,
            self.sync_asic_write_high_low,
            [addr_high, addr_low, value],
        )

    def set_auto_exposure(self, key: str, enabled: bool) -> None:
        self.queue_command(key, self.sync_set_auto_exposure, [enabled])

    def sync_set_auto_exposure(self, enabled: bool) -> int:
        """
        Toggle firmware auto exposure. Read-modify-write so only the enable
        bit of the AE control register changes. Also sets the legacy AE
        register, which firmware with the older workaround requires.
        """
        with self._lock:
            legacy_ret = self.sync_asic_write(
                StellarRegisterMap.REG_AE_LEGACY, 1 if enabled else 0
            )

            ret, val = self.asic_read(StellarRegisterMap.REG_AE)
            if ret != 0:
                return ret
            val = (val | 0x01) if enabled else (val & ~0x01)
            return legacy_ret | self.sync_asic_write(
                StellarRegisterMap.REG_AE, val & 0xFF
            )

    def get_auto_exposure(self) -> bool | None:
        ret, val = self.asic_read(StellarRegisterMap.REG_AE)
        return bool(val & 0x01) if ret == 0 else None

    def sensor_write(self, key: str, addr: int, data: int) -> None:
        self.queue_command(key, self.sync_sensor_write, [addr, bytes([data & 0xFF])])

    def _get_chip_id(self) -> int | None:
        known_first = {0x92}
        known_second = {0x86}

        CHIP_ID_FIRST = 0x101F
        CHIP_ID_SECOND = 0x80F0

        ret_first, chip_id_first = self.asic_read(CHIP_ID_FIRST)
        ret_second, chip_id_second = self.asic_read(CHIP_ID_SECOND)

        if ret_first != 0 and ret_second != 0:
            self.logger.error("Failed to read chip id!")
            return None

        if chip_id_first in known_first:
            return chip_id_first
        elif chip_id_second in known_second:
            return chip_id_second
        else:
            return None

    def read_string3(self) -> str | None:

        # SPI-flash controller registers for the active architecture
        if self.device_family == DeviceFamily.EXPLOREHD:
            SF_MODE, SF_TRIG, SF_WDATA, SF_RDATA, SF_RDY, SF_CS = (
                0x1080,
                0x1081,
                0x1082,
                0x1083,
                0x1084,
                0x1091,
            )
        else:
            SF_MODE, SF_TRIG, SF_WDATA, SF_RDATA, SF_RDY, SF_CS = (
                0x8E00,
                0x8E01,
                0x8E02,
                0x8E03,
                0x8E04,
                0x8E11,
            )

        def wait_ready() -> int:
            for _ in range(50):
                ret, ready_value = self.asic_read(SF_RDY)
                if ret != 0:
                    return ret
                if ready_value & 0x01:
                    return 0
                time.sleep(0.001)
            return -1

        def spi_begin() -> int:
            ret = 0
            ret |= self.sync_asic_write(SF_MODE, 1)
            ret |= self.sync_asic_write(SF_CS, 0)
            return ret

        def spi_end() -> int:
            ret = 0
            ret |= self.sync_asic_write(SF_CS, 1)
            ret |= self.sync_asic_write(SF_MODE, 0)
            return ret

        def spi_send(b) -> int:
            ret = 0
            ret |= self.sync_asic_write(SF_WDATA, b & 0xFF)
            ret |= self.sync_asic_write(SF_TRIG, 1)  # write phase
            ret |= wait_ready()
            return ret

        def spi_recv() -> tuple[int, int]:
            ret = 0
            ret |= self.sync_asic_write(SF_RDATA, 0)
            ret |= self.sync_asic_write(SF_TRIG, 2)  # read phase
            ret |= wait_ready()
            if ret != 0:
                return ret, 0
            return self.asic_read(SF_RDATA)

        def read_flash(addr, n) -> tuple[int, bytes]:
            ret = 0
            ret |= spi_begin()
            ret |= spi_send(0x0B)  # FAST_READ
            ret |= spi_send((addr >> 16) & 0xFF)  # 3 address bytes, MSB first
            ret |= spi_send((addr >> 8) & 0xFF)
            ret |= spi_send(addr & 0xFF)
            ret |= spi_send(0x00)  # 1 dummy byte for fast-read

            data_values = []
            for _ in range(n):
                spi_ret, data_value = spi_recv()
                data_values.append(data_value)

                ret |= spi_ret

            ret |= spi_end()
            return ret, bytes(data_values)

        ret, st = read_flash(0x160, 0x2B)  # Get the sector table (43 bytes)
        if ret != 0:
            self.logger.error("Failed to read flash memory!")
            return None

        # Get the correct address
        param_start = (st[0x0F] << 24) | (st[0x10] << 16) | (st[0x11] << 8) | st[0x12]

        # Decode the value
        ret, slot = read_flash(
            param_start + 0x100, 0x40
        )  # 64-byte USB string descriptor

        if ret != 0:
            self.logger.error("Failed to read slot!")
            return None

        if slot[1] != 0x03 or slot[0] in (0x00, 0xFF):
            self.logger.error("Slot is invalid!")
            return None

        nchars = (slot[0] - 2) // 2
        return "".join(chr(slot[2 + 2 * i]) for i in range(nchars))

    def sensor_write_high_low(
        self,
        key: str,
        addr_high: int,
        addr_low: int,
        value: int,
    ) -> None:
        self.queue_command(
            key,
            self.sync_sensor_write_high_low,
            [addr_high, addr_low, value],
        )

    def sync_asic_write(self, addr: int, data: int, dummy: bool = False) -> int:
        """
        Write a value to an ASIC register.
        """
        with self._lock:
            if self._is_disabled:
                return 1

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
            if self._is_disabled:
                return (1, -1)

            # perform a dummy write to select the correct address
            ret = self.sync_asic_write(addr, 0, True)
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

    def sync_asic_write_high_low(
        self, addr_high: int, addr_low: int, value: int
    ) -> None:
        """
        Write asic with high and low registers
        """
        val_low = value & 0xFF
        # TODO: return after first fails... (we dont even use the status anyway)
        _ret = self.sync_asic_write(addr_low, val_low)

        val_high = value >> 8 & 0xFF
        _ret = self.sync_asic_write(addr_high, val_high)

    def asic_read_high_low(
        self,
        addr_high: int,
        addr_low: int,
    ) -> int | None:
        """
        Read asic with high and low registers
        """
        ret, val_high = self.asic_read(addr_high)
        ret, val_low = self.asic_read(addr_low)
        if ret != 0:
            return None
        return val_high << 8 | val_low

    def _sensor_i2c_request(
        self, reg: int, data: bytes | None = None, read_len: int = 0
    ) -> bytes:
        """
        Build a firmware sensor I2C request. Pass `data` for a write or
        `read_len` for a read.
        """
        n = read_len if data is None else len(data)
        if not 0 < n <= SENSOR_I2C_MAX_DATA:
            raise ValueError(f"Invalid sensor I2C data length: {n}")

        buf = bytearray(SENSOR_I2C_LEN)
        buf[0] = self.sensor_slave_id
        buf[1] = SENSOR_ADDR_BYTES
        buf[2] = SENSOR_ADDR_BYTES + n
        buf[3] = (reg >> 8) & 0xFF
        buf[4] = reg & 0xFF
        if data is not None:
            start = SENSOR_I2C_HEADER + SENSOR_ADDR_BYTES
            buf[start : start + n] = data
            buf[SENSOR_I2C_FLAG] = SENSOR_I2C_WRITE
        else:
            buf[SENSOR_I2C_FLAG] = SENSOR_I2C_READ
        return bytes(buf)

    def sync_sensor_write(self, reg: int, data: bytes) -> int:
        """
        Write consecutive bytes to sensor registers starting at `reg` through
        the firmware I2C command.

        Returns 0 on success (ioctl style).
        """
        request = self._sensor_i2c_request(reg, data=data)

        with self._lock:
            if self._is_disabled:
                return 1

            return self.camera.uvc_set_ctrl(
                Unit.SYS_ID.value,
                Selector.SYS_SENSOR_I2C.value,
                request,
                SENSOR_I2C_LEN,
            )

    def sync_sensor_write_many(
        self, writes: list[tuple[int, bytes]], group_hold: bool = False
    ) -> int:
        """
        Write several sensor register runs in order. With `group_hold`, the
        sensor latches all of them on the same frame.

        Returns 0 on success (ioctl style).
        """
        with self._lock:
            ret = 0
            if group_hold:
                ret |= self.sync_sensor_write(
                    StellarSensorMap.GROUP_HOLD,
                    bytes([StellarSensorMap.GROUP_HOLD_START]),
                )
            for reg, data in writes:
                ret |= self.sync_sensor_write(reg, data)
            if group_hold:
                ret |= self.sync_sensor_write(
                    StellarSensorMap.GROUP_HOLD,
                    bytes([StellarSensorMap.GROUP_HOLD_END]),
                )
                ret |= self.sync_sensor_write(
                    StellarSensorMap.GROUP_HOLD,
                    bytes([StellarSensorMap.GROUP_HOLD_LAUNCH]),
                )
            return ret

    def wait_for_sensor(
        self, timeout_s: float, cancelled: Callable[[], bool] | None = None
    ) -> bool:
        """
        Wait until the sensor answers on I2C. It only does while streaming, a
        second or two after the stream starts.

        Returns False on timeout, when cancelled, or when the interface stops.
        """
        deadline = time.monotonic() + timeout_s
        while time.monotonic() < deadline:
            if not self._is_worker_running or (cancelled and cancelled()):
                return False
            ret, _ = self.sensor_read(StellarSensorMap.VTS_HIGH, warn=False)
            if ret == 0:
                return True
            time.sleep(0.1)
        return False

    def sensor_read(
        self, reg: int, length: int = 1, warn: bool = True
    ) -> tuple[int, bytes]:
        """
        Read `length` consecutive bytes from sensor registers starting at `reg`
        through the firmware I2C command. With `warn`, a sensor that does not
        answer is logged.

        Returns 0 on success, along with the bytes read. (ioctl style)
        On failure, returns a non-zero error code and empty bytes.
        """
        request = self._sensor_i2c_request(reg, read_len=length)

        with self._lock:
            if self._is_disabled:
                return (1, b"")

            ret = self.camera.uvc_set_ctrl(
                Unit.SYS_ID.value,
                Selector.SYS_SENSOR_I2C.value,
                request,
                SENSOR_I2C_LEN,
            )
            if ret != 0:
                return (ret, b"")

            reply = ctypes.create_string_buffer(SENSOR_I2C_LEN)
            ret = self.camera.uvc_get_ctrl(
                Unit.SYS_ID.value,
                Selector.SYS_SENSOR_I2C.value,
                reply,
                SENSOR_I2C_LEN,
            )
            if ret != 0:
                return (ret, b"")

        raw = reply.raw
        # A wrong slave id / absent sensor comes back as a 0 byte count
        if raw[2] != length:
            if not warn:
                return (1, b"")
            self.logger.warning(
                "Sensor did not respond reading 0x%04X (slave 0x%02X)",
                reg,
                self.sensor_slave_id,
            )
            return (1, b"")

        return (0, raw[SENSOR_I2C_HEADER : SENSOR_I2C_HEADER + length])

    def sync_sensor_write_high_low(
        self, reg_high: int, reg_low: int, value: int
    ) -> int:
        """
        Write high byte from value to high register, low byte to low
        """
        high = (value >> 8) & 0xFF
        low = value & 0xFF

        # Adjacent registers go in one transaction so the sensor never latches
        # a half-written value
        if reg_low == reg_high + 1:
            return self.sync_sensor_write(reg_high, bytes([high, low]))

        ret = self.sync_sensor_write(reg_high, bytes([high]))
        ret |= self.sync_sensor_write(reg_low, bytes([low]))
        return ret

    def sensor_read_high_low(self, reg_high: int, reg_low: int) -> int | None:
        """
        Read high byte from high register to value, low byte to low
        """
        if reg_low == reg_high + 1:
            ret, data = self.sensor_read(reg_high, 2)
            if ret != 0:
                return None
            return (data[0] << 8) | data[1]

        ret, high = self.sensor_read(reg_high)
        if ret != 0:
            return None
        ret, low = self.sensor_read(reg_low)
        if ret != 0:
            return None

        return (high[0] << 8) | low[0]
