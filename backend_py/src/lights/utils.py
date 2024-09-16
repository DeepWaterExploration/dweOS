import logging
from .fake_pwm import FakePWMController

def get_rpi_model():
    try:
        with open('/sys/firmware/devicetree/base/model', 'r') as m:
            model = m.read().lower()
            if 'raspberry pi 3' in model:
                return 3
            elif 'raspberry pi 4' in model:
                return 4
            elif 'raspberry pi 5' in model:
                return 5
            return None
    except:
        return None
    
def create_pwm_controllers():
    pwm_controllers = []
    version = get_rpi_model()
    if version is not None:
        logging.info(f'Device is Raspberry Pi {version}')
        from .rpi_pwm_hardware import RPiHardwarePWMController
        if version == 5:
            pwm_controllers.append(RPiHardwarePWMController(chip=2, pins={
                12: 0,
                13: 1,
                18: 2,
                19: 3
            }))
        else:
            pwm_controllers.append(RPiHardwarePWMController())
    else:
        pwm_controllers.append(FakePWMController())
    return pwm_controllers
