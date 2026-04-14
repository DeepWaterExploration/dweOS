from .pwm_controller import PWMController


class FakePWMController(PWMController):
    NAME = "Fake PWM Controller"

    def __init__(self) -> None:
        super().__init__()

    def is_pwm_pin(self, pin: int) -> bool:
        return True

    def set_intensity(self, pin: int, intensity: float) -> None:
        # logging.log(f'{}')
        pass

    def cleanup(self) -> None:
        pass

    def disable_pin(self, pin: int) -> None:
        pass

    def get_pins(self):
        return [1, 2, 3, 4]
