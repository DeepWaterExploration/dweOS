import serial
from .schemas import PWMConfig
import logging
import asyncio
from typing import Dict
import json
from serial.tools import list_ports
import aiofiles

frequency_table = {
    60: 60.6,
    50: 50.3,
    40: 40.3,
    30: 30.3,
    15: 15.3
}


def find_ch341_device():
    print(list_ports.comports())
    raise RuntimeError("CH341 USB Serial device not found")


class SerialPWMController:
    def __init__(self, port: str = "/dev/ttyUSB0", baudrate: int = 9600, settings_path='./'):
        self.settings_path = f"{settings_path}/serial_pwm_settings.json"
        self.settings: Dict = {'frequency': 0, 'duty_cycle': 0}
        self._sync_task = None

        self.found_port = False
        self.has_printed_error = False

        self._load_settings()

        self.port = port
        self.logger = logging.getLogger("dwe_os_2.pwm.SerialPWMController")
        self.baudrate = baudrate
        self.current_config = PWMConfig(
            frequency=self.settings['frequency'],
            duty_cycle=self.settings['duty_cycle']
        )

    async def _open_serial(self):
        try:
            self.logger.info('Opening serial port')
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
        except serial.serialutil.SerialException as e:
            if self.has_printed_error:
                return
            self.has_printed_error = True
            self.logger.error(f"No serial port found: {e}")

    def set_manual_frequency(self, frequency: float):
        self.apply(PWMConfig(frequency=frequency, duty_cycle=30))

    def start(self):
        """Starts the background asyncio task to sync settings."""
        loop = asyncio.get_running_loop()
        self._sync_task = loop.create_task(self._run_settings_sync())
        asyncio.get_event_loop().create_task(self._open_serial())

    def _load_settings(self):
        try:
            with open(self.settings_path, "r") as f:
                loaded = json.load(f)
                print(loaded)
                self.settings = loaded
        except (FileNotFoundError, json.JSONDecodeError):
            self.settings = {'frequency': 0, 'duty_cycle': 0}
            with open(self.settings_path, "w") as f:
                json.dump(self.settings, f)

    def apply(self, config: PWMConfig):
        if not self.found_port:
            self.logger.info(f"No connected USB serial PWM controller")
            return
        self.current_config = config
        self.settings['frequency'] = config.frequency
        self.settings['duty_cycle'] = config.duty_cycle
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

    async def _run_settings_sync(self):
        while True:
            if not self.found_port:
                await self._open_serial()
            async with aiofiles.open(self.settings_path, "w") as f:
                await f.write(json.dumps(self.settings))
            await asyncio.sleep(1)

    def get_current_config(self) -> PWMConfig:
        return self.current_config
