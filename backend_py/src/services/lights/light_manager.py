from typing import List, Dict
from .pwm_controller import PWMController
from .light import Light
import logging


class LightManager:

    def __init__(self, pwm_controllers: List[PWMController]) -> None:
        self.pwm_controllers = pwm_controllers
        self.lights: List[Light] = []
        for controller_index in range(len(self.pwm_controllers)):
            controller = self.pwm_controllers[controller_index]
            for pin in controller.get_pins():
                self.lights.append(
                    Light(
                        intensity=0,
                        pin=pin,
                        controller_index=controller_index,
                        controller_name=controller.NAME,
                        nickname="",
                    )
                )

    def set_intensity(self, index: int, intensity: float):
        light = self.lights[index]
        light.intensity = intensity
        pwm_controller = self.pwm_controllers[light.controller_index]
        logging.info(
            f"Setting light ({pwm_controller.NAME}): {light.pin}, {light.intensity}"
        )
        pwm_controller.set_intensity(light.pin, intensity)

    def disable_light(self, controller_index: int, pin: int):
        if controller_index >= len(self.pwm_controllers):
            logging.error("Invalid index given for pwm controller")
            return

        pwm_controller = self.pwm_controllers[controller_index]
        logging.info(f"Disabling light ({pwm_controller.NAME}): {pin}")
        pwm_controller.disable_pin(pin)

    def get_lights(self):
        return self.lights

    def cleanup(self):
        for pwm_controller in self.pwm_controllers:
            pwm_controller.cleanup()
