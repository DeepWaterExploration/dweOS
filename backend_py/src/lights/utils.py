import logging
from .fake_pwm import FakePWMController

def is_raspberry_pi():
    try:
        with open('/sys/firmware/devicetree/base/model', 'r') as m:
            return 'raspberry pi 4' in m.read().lower()
    except:
        return False
    
def create_pwm_controllers():
    pwm_controllers = []
    if is_raspberry_pi():
        # from .rpi_pwm_software import RPiSoftwarePWMController
        from .rpi_pwm_hardware import RPiHardwarePWMController
        # pwm_controllers.append(RPiSoftwarePWMController())
        pwm_controllers.append(RPiHardwarePWMController())
    # else:
    #     pwm_controllers.append(FakePWMController())
    return pwm_controllers
