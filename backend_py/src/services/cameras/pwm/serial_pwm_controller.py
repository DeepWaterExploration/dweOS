import asyncio
import logging
import time

import serial
from serial.tools import list_ports

DWE_PWM_USB_VID = 0x3961
DWE_PWM_USB_PID = 0x5000

LEG_PWM_USB_VID = 0x0403
LEG_PWM_USB_PID = 0x6001

frequency_table = {60: 60.0, 50: 50.0, 40: 40.0, 30: 30.0, 15: 15.0}

MONITOR_INTERVAL_SEC = 0.75

# While this unit is enabled, it owns the PWM board and dweOS acts as if the
# board does not exist. The board resets whenever its port is opened or closed,
# so dweOS must not open it at all, even briefly (see README)
PWM_OWNER_UNIT = "rtpsender.service"
OWNER_CHECK_INTERVAL_SEC = 5.0


async def _is_unit_enabled(unit: str) -> bool:
    try:
        # Exit code 0 indicates the unit is enabled or will start at boot
        # via other means.
        process = await asyncio.create_subprocess_exec(
            "systemctl",
            "is-enabled",
            "-q",
            unit,
            stderr=asyncio.subprocess.DEVNULL,
        )
    except OSError:
        # No systemd (e.g. containers), so nothing can own the board
        return False

    try:
        return_code = await asyncio.wait_for(process.wait(), timeout=5)
    except asyncio.TimeoutError:
        process.kill()
        # Can't tell, so don't risk resetting a board that may be in use
        return True

    return return_code == 0


def _find_pwm_device_path() -> str | None:
    """
    Find the PWM device path of a DWE frame synchronization board:

    `3961:5000 DeepWater Exploration Frame Sync Module`: Latest version of firmware
    `0403:6001 FTDI`: Legacy version. Will be deprecated in the future
    """
    for port in list_ports.comports():
        if port.vid is None or port.pid is None:
            continue
        if (port.vid == DWE_PWM_USB_VID and port.pid == DWE_PWM_USB_PID) or (
            port.vid == LEG_PWM_USB_VID and port.pid == LEG_PWM_USB_PID
        ):
            return port.device
    return None


class SerialPWMController:
    def __init__(
        self, baudrate: int = 9600, frequency_offset: float = 0, pwm_light_mode=False
    ) -> None:
        self.found_port = False
        self.has_printed_error = False
        self.frequency_offset = frequency_offset
        self.pwm_light_mode = pwm_light_mode

        self.logger = logging.getLogger("dwe_os_2.pwm.SerialPWMController")
        self.baudrate = baudrate
        self.frequency = 0
        self.duty_cycle = 0
        self.serial = None
        self._monitor_task: asyncio.Task | None = None
        self._running = False

        self.owner_enabled = False
        self._last_owner_check = 0.0

        # Apply 100% brightness on start
        if pwm_light_mode:
            self.apply(60, 100)

    def set_frequency_offset(self, frequency_offset: float) -> None:
        if not self.pwm_light_mode:
            self.frequency_offset = frequency_offset
            self.apply(self.frequency, self.duty_cycle)

    def _disconnect_serial(self) -> None:
        self.found_port = False
        if self.serial is not None:
            try:
                if self.serial.is_open:
                    self.serial.close()
            except Exception:
                pass
            self.serial = None

    async def _update_owner_enabled(self) -> None:
        now = time.monotonic()
        if now - self._last_owner_check < OWNER_CHECK_INTERVAL_SEC:
            return
        self._last_owner_check = now

        owner_enabled = await _is_unit_enabled(PWM_OWNER_UNIT)
        if owner_enabled != self.owner_enabled:
            if owner_enabled:
                self.logger.info(
                    "%s is enabled, ignoring the PWM board", PWM_OWNER_UNIT
                )
            else:
                self.logger.info(
                    "%s is no longer enabled, using the PWM board", PWM_OWNER_UNIT
                )
        self.owner_enabled = owner_enabled

    async def _monitor_loop(self) -> None:
        try:
            while self._running:
                await self._update_owner_enabled()
                path = None if self.owner_enabled else _find_pwm_device_path()
                if path:
                    if (
                        self.found_port
                        and self.serial is not None
                        and (self.serial.port != path or not self.serial.is_open)
                    ):
                        self._disconnect_serial()
                    if not self.found_port:
                        try:
                            self.serial = serial.Serial(
                                port=path, baudrate=self.baudrate, timeout=1
                            )
                            self.found_port = True
                            self.has_printed_error = False
                            self.logger.info("PWM USB serial connected at %s", path)

                            # Wait until serial connects
                            await asyncio.sleep(4)

                            # Perform initial apply
                            self.apply(self.frequency, self.duty_cycle)
                        except serial.SerialException as e:
                            if not self.has_printed_error:
                                self.logger.error("PWM serial open failed: %s", e)
                                self.has_printed_error = True
                            self._disconnect_serial()
                else:
                    if self.found_port:
                        self._disconnect_serial()
                        self.logger.info("PWM USB serial disconnected")

                # May be better to trigger this only when a frequency is applied
                await asyncio.sleep(MONITOR_INTERVAL_SEC)
        except asyncio.CancelledError:
            raise
        finally:
            self._disconnect_serial()

    def start(self) -> None:
        """Starts the background asyncio task to sync settings."""
        if self._monitor_task is not None and not self._monitor_task.done():
            return
        self._running = True
        self._monitor_task = asyncio.create_task(self._monitor_loop())

    def apply(self, frequency: float, duty_cycle: int) -> None:
        # Make sure that even if the serial pwm is not yet connected, it will
        # have the correct clock frequency
        self.frequency = frequency
        self.duty_cycle = duty_cycle
        if not self.found_port:
            return
        command = f"{frequency + self.frequency_offset},{duty_cycle}\n"

        if self.serial:
            self.logger.info(f"Sending command {command.strip()}")
            self.serial.write(command.encode("utf-8"))

    def apply_from_fps(self, fps: int) -> None:
        if self.pwm_light_mode:
            self.logger.info(
                "apply_from_fps was called, but PWM controller is being used for "
                "lighting. Ignoring request."
            )
            return
        self.apply(fps, 30)

    def stop(self) -> None:
        self.apply(0, 0)

    def close(self) -> None:
        self._running = False
        if self._monitor_task is not None:
            self._monitor_task.cancel()
            self._monitor_task = None
        self._disconnect_serial()

    def get_current_config(self) -> tuple[float, int]:
        return (self.frequency, self.duty_cycle)
