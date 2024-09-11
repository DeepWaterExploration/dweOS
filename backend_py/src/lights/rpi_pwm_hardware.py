from rpi_hardware_pwm import HardwarePWM
from .pwm_controller import PWMController
from typing import Dict
import logging

class RPiHardwarePWMController(PWMController):
    NAME = 'Hardware PWM Controller'

    PWM_PINS = {
        18: 0,
        19: 1
    }

    def __init__(self) -> None:
        super().__init__()

        self.pwm_objects: Dict[int, HardwarePWM] = {}

    def is_pwm_pin(self, pin: int) -> bool:
        return pin in self.PWM_PINS.keys()

    def set_intensity(self, pin: int, intensity: float):
        if not self.is_pwm_pin(pin):
            return

        # delete the object if intensity is zero and return
        if pin in self.pwm_objects and intensity == 0:
            self.pwm_objects[pin].stop()
            del self.pwm_objects[pin]
            return

        if pin not in self.pwm_objects:
            self.pwm_objects[pin] = HardwarePWM(pwm_channel=self.PWM_PINS[pin], hz=7812.5, chip=0)
            self.pwm_objects[pin].start(0)

        duty_cycle = max(0, min(100, intensity))
        self.pwm_objects[pin].change_duty_cycle(duty_cycle)

    def cleanup(self):
        for pwm in self.pwm_objects.values():
            pwm.stop()
        GPIO.cleanup()

    def get_pins(self):
        return [18, 19]