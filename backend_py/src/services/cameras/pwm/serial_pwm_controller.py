import serial
import logging
import asyncio
import time
from serial.tools import list_ports

frequency_table = {
    60: 60.0,
    50: 50.0,
    40: 40.0,
    30: 30.0,
    15: 15.0
}


class SerialPWMController:
    def __init__(self, port: str = "/dev/ttyUSB0", baudrate: int = 9600, frequency_offset: float = 0):
        self.found_port = False
        self.has_printed_error = False
        self.frequency_offset = frequency_offset

        self.port = port
        self.logger = logging.getLogger("dwe_os_2.pwm.SerialPWMController")
        self.baudrate = baudrate
        self.frequency = 0
        self.duty_cycle = 0

    def set_frequency_offset(self, frequency_offset: float):
        self.frequency_offset = frequency_offset
        self.apply(self.frequency, self.duty_cycle)

    def _open_serial(self):
        for _ in range(5):
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
                            self.logger.info(line.strip())
                            self.apply(self.frequency, self.duty_cycle)
                            return
                        time.sleep(1)

                    logging.error(
                        'Firmware might be bad on pwm controller or there is a nonstandard serial device connected.')
                else:
                    break
            except serial.serialutil.SerialException as e:
                pass

            time.sleep(0.5)

        self.logger.info("No serial device found")

    def start(self):
        """Starts the background asyncio task to sync settings."""
        self._open_serial()

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
        self.serial.write(command.encode("utf-8"))

    def apply_from_fps(self, fps: int):
        self.apply(frequency_table[fps], 30)

    def stop(self):
        self.apply(0, 0)

    def close(self):
        if self.serial.is_open:
            self.serial.close()

    def get_current_config(self) -> tuple[float, int]:
        return (self.frequency, self.duty_cycle)
