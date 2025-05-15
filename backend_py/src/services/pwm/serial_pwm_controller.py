import serial
from .schemas import PWMConfig
import logging
import asyncio
from typing import Dict
import json
from serial.tools import list_ports
import aiofiles


def read_pwm_offset(path="/opt/device-intrinsics/PWM_OFFSET") -> float:
    try:
        with open(path, "r") as f:
            return float(f.read().strip())
    except (FileNotFoundError, ValueError):
        return 0.0


OFFSET = read_pwm_offset()

frequency_table = {
    60: 60.3 + OFFSET,
    50: 50.0 + OFFSET,
    40: 40.0 + OFFSET,
    30: 30.0 + OFFSET,
    15: 15.0 + OFFSET
}


def find_ch341_device():
    print(list_ports.comports())
    raise RuntimeError("CH341 USB Serial device not found")


class SerialPWMController:
    def __init__(self, port: str = "/dev/ttyUSB0", baudrate: int = 9600):
        self.found_port = False
        self.has_printed_error = False

        self.port = port
        self.logger = logging.getLogger("dwe_os_2.pwm.SerialPWMController")
        self.baudrate = baudrate
        self.current_config = PWMConfig(
            frequency=0,
            duty_cycle=0
        )

        self.logger.info(f'Read device intrinsics PWM_OFFSET: {OFFSET}')

    async def _open_serial(self):
        while True:
            try:
                if not self.found_port:
                    self.serial = serial.Serial(
                        port=self.port, baudrate=self.baudrate, timeout=1)
                    self.found_port = True

                    # Initial apply

                    for _ in range(10):
                        line = self.serial.readline().decode('utf-8').strip()
                        if 'PWM frequency' in line:
                            self.logger.info('APPLYING INITIAL CONFIG')
                            self.logger.info(line)
                            self.apply(self.current_config)
                            return
                        await asyncio.sleep(1)

                    logging.error('Firmware is likely bad on pwm controller.')
                else:
                    break
            except serial.serialutil.SerialException as e:
                if self.has_printed_error:
                    return
                self.has_printed_error = True
                self.logger.error(f"No serial port found: {e}")

    def set_manual_frequency(self, frequency: float):
        self.apply(PWMConfig(frequency=frequency, duty_cycle=30))

    def start(self):
        """Starts the background asyncio task to sync settings."""
        asyncio.get_event_loop().create_task(self._open_serial())

    def apply(self, config: PWMConfig):
        # Make sure that even if the serial pwm is not yet connected, it will
        # have the correct clock frequency
        self.current_config = config
        if not self.found_port:
            self.logger.info(f"No connected USB serial PWM controller")
            return
        command = f"{config.frequency},{config.duty_cycle}\n"
        self.logger.info(f"Sending command {command}")
        self.serial.write(command.encode("utf-8"))

    def apply_from_fps(self, fps: int):
        self.apply(PWMConfig(frequency=frequency_table[fps], duty_cycle=30))

    def stop(self):
        self.apply(PWMConfig(frequency=0, duty_cycle=0))

    def close(self):
        if self.serial.is_open:
            self.serial.close()

    def get_current_config(self) -> PWMConfig:
        return self.current_config
