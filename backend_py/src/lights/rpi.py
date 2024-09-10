import RPi.GPIO as GPIO
from .pwm_controller import PWMController
from typing import Dict

class RaspberryPiPWMController(PWMController):
    def __init__(self) -> None:
        super().__init__()

        GPIO.setmode(GPIO.BCM)
        self.pwm_objects: Dict[int, GPIO.PWM] = {}
    
    def is_pwm_pin(self, pin: int) -> bool:
        return True

    def set_intensity(self, pin: int, intensity: float):
        # delete the object if intensity is zero and return
        if pin in self.pwm_objects and intensity == 0:
            self.pwm_objects[pin].stop()
            del self.pwm_objects[pin]
            return

        if pin not in self.pwm_objects:
            GPIO.setup(pin, GPIO.OUT)
            self.pwm_objects[pin] = GPIO.PWM(pin, 1000)
            self.pwm_objects[pin].start(0)

        duty_cycle = max(0, min(100, intensity))
        self.pwm_objects[pin].ChangeDutyCycle(duty_cycle)

    def cleanup(self):
        for pwm in self.pwm_objects.values():
            pwm.stop()
        GPIO.cleanup()
