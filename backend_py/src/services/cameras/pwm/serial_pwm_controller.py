import serial
import logging
import asyncio
from serial.tools import list_ports

DWE_PWM_USB_VID = 0x3961
DWE_PWM_USB_PID = 0x5000

LEG_PWM_USB_VID = 0x0403
LEG_PWM_USB_PID = 0x6001

frequency_table = {60: 60.0, 50: 50.0, 40: 40.0, 30: 30.0, 15: 15.0}

MONITOR_INTERVAL_SEC = 0.75


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
    def __init__(self, baudrate: int = 9600, frequency_offset: float = 0):
        self.found_port = False
        self.has_printed_error = False
        self.frequency_offset = frequency_offset

        self.logger = logging.getLogger("dwe_os_2.pwm.SerialPWMController")
        self.baudrate = baudrate
        self.frequency = 0
        self.duty_cycle = 0
        self.serial = None
        self._monitor_task: asyncio.Task | None = None
        self._running = False

    def set_frequency_offset(self, frequency_offset: float):
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

    async def _monitor_loop(self) -> None:
        try:
            while self._running:
                path = _find_pwm_device_path()
                if path:
                    if self.found_port and self.serial is not None:
                        if self.serial.port != path or not self.serial.is_open:
                            self._disconnect_serial()
                    if not self.found_port:
                        try:
                            self.serial = serial.Serial(
                                port=path, baudrate=self.baudrate, timeout=1
                            )
                            self.found_port = True
                            self.has_printed_error = False
                            self.logger.info("PWM USB serial connected at %s", path)
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

    def start(self):
        """Starts the background asyncio task to sync settings."""
        if self._monitor_task is not None and not self._monitor_task.done():
            return
        self._running = True
        self._monitor_task = asyncio.create_task(self._monitor_loop())

    def apply(self, frequency: float, duty_cycle: int):
        # Make sure that even if the serial pwm is not yet connected, it will
        # have the correct clock frequency
        self.frequency = frequency
        self.duty_cycle = duty_cycle
        if not self.found_port:
            self.logger.info(f"No connected USB serial PWM controller")
            return
        command = f"{frequency + self.frequency_offset},{duty_cycle}\n"
        self.logger.info(f"Sending command {command.strip()}")

        if self.serial:
            self.serial.write(command.encode("utf-8"))

    def apply_from_fps(self, fps: int):
        self.apply(frequency_table[fps], 30)

    def stop(self):
        self.apply(0, 0)

    def close(self):
        self._running = False
        if self._monitor_task is not None:
            self._monitor_task.cancel()
            self._monitor_task = None
        self._disconnect_serial()

    def get_current_config(self) -> tuple[float, int]:
        return (self.frequency, self.duty_cycle)
