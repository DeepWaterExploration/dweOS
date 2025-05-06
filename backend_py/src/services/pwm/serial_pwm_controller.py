import serial
from .schemas import PWMConfig
import logging

frequency_table = {
    60: 60.3,
    50: 50,
    40: 40,
    30: 30,
    15: 15
}


class SerialPWMController:
    def __init__(self, port: str = "/dev/ttyACM0", baudrate: int = 9600):
        self.port = port
        self.baudrate = baudrate
        self.serial = serial.Serial(
            port=self.port, baudrate=self.baudrate, timeout=1)
        self.logger = logging.getLogger("dwe_os_2.pwm.SerialPWMController")
        self.current_config = PWMConfig(frequency=0, duty_cycle=0)

    def apply(self, config: PWMConfig):
        """
        Sends a PWM configuration to the Arduino.

        Format: \<frequency\>,\<duty_cycle\>\n
        """
        self.current_config = config
        command = f"{config.frequency},{config.duty_cycle}\n"
        self.logger.debug(f"Sending command {command}")
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
