import logging

# from .fake_pwm import FakePWMController
import re
import os


def is_overlay_loaded():
    """
    Based on function from rpi_hardware_pwm
    """
    chippath = "/sys/class/pwm/pwmchip0"
    return os.path.isdir(chippath)


def get_rpi_version():
    try:
        # Read the device model from the file
        with open("/sys/firmware/devicetree/base/model", "r") as f:
            model = f.read().strip()

        # Check if the device is a Raspberry Pi
        if "Raspberry Pi" in model:
            # Extract the version number using regex
            match = re.search(r"Raspberry Pi\s+(\d+)", model)
            if match:
                # Return the numeric model version
                version = int(match.group(1))
                return version
            else:
                # Fallback if no version number is found
                return None
        else:
            return None

    except FileNotFoundError:
        # In case the file doesn't exist or is not accessible
        return None


def create_pwm_controllers():
    pwm_controllers = []
    version = get_rpi_version()
    logger = logging.getLogger("dwe_os_2.pwm")
    if version is not None:
        logger.info(f"Device is Raspberry Pi {version}")
        if not is_overlay_loaded():
            logger.warning(
                "PWM Overlay not loaded. Need to add 'dtoverlay=pwm-2chan' to /boot/config.txt and reboot"
            )
            return []
        from .rpi_pwm_hardware import RPiHardwarePWMController

        if version == 5:
            pwm_controllers.append(
                RPiHardwarePWMController(chip=2, pins={12: 0, 13: 1, 18: 2, 19: 3})
            )
        else:
            pwm_controllers.append(RPiHardwarePWMController())
    else:
        logger.info("No supported PWM Controllers Found.")
    return pwm_controllers
