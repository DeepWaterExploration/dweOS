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
        self.frequency = 0
        self.duty_cycle = 0

    def _open_serial(self):
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
                            self.apply(self.frequency, self.duty_cycle)
                            return
                        time.sleep(1)

                    logging.error('Firmware is likely bad on pwm controller.')
                else:
                    break
            except serial.serialutil.SerialException as e:
                self.has_printed_error = True
                self.logger.error(f"No serial port found: {e}")

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
        command = f"{frequency},{duty_cycle}\n"
        self.logger.info(f"Sending command {command}")
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
