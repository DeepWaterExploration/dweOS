import os
from dataclasses import dataclass
from typing import List
import re
import time

@dataclass
class PWMChannel:
    channel: int
    frequency: float = 0
    duty_cycle: float = 0

@dataclass
class PWMChip:
    chip: int
    channels: List[PWMChannel]

class PWMManager:
    PWM_BASE_PATH = '/sys/class/pwm'
    CHIP_REGEX = re.compile(r"pwmchip(\d+)")
    CHANNEL_REGEX = re.compile(r"pwm(\d+)")

    def __init__(self) -> None:
        self.chips: List[PWMChip] = []

        self._enumerate()

    def enable_channel(self, chip_id: int, channel_id: int):
        self._echo(os.path.join(self._get_channel_path(chip_id, channel_id), 'enable'), 1)

    def disable_channel(self, chip_id: int, channel_id: int):
        self._echo(os.path.join(self._get_channel_path(chip_id, channel_id), 'enable'), 0)

    def set_channel_frequency(self, chip_id: int, channel_id: int, frequency: float):
        channel = self._get_channel(chip_id, channel_id)
        channel.frequency = frequency

        # Save the current duty cycle and zero it
        original_duty_cycle = channel.duty_cycle
        if original_duty_cycle:
            self._set_duty_cycle(chip_id, channel_id, 0, channel.frequency)

        # Update the frequency
        self._set_channel_frequency(chip_id, channel_id, frequency)

        # Restore the original duty cycle
        self._set_duty_cycle(chip_id, channel_id, original_duty_cycle, frequency)

    def set_channel_duty_cycle(self, chip_id: int, channel_id: int, duty_cycle: float):
        channel = self._get_channel(chip_id, channel_id)
        self._set_duty_cycle(chip_id, channel_id, duty_cycle, channel.frequency)
        channel.duty_cycle = duty_cycle

    def _set_channel_frequency(self, chip_id: int, channel_id: int, frequency: float):
        period_ns = int((1 / frequency) * 1_000_000_000)
        period_path = os.path.join(self._get_channel_path(chip_id, channel_id), 'period')

        self._echo(period_path, period_ns)

    def _set_duty_cycle(self, chip_id: int, channel_id: int, duty_cycle: float, frequency: float):
        # Compute duty cycle in nanoseconds
        period_ns = int((1 / frequency) * 1_000_000_000)
        duty_cycle_ns = int((duty_cycle / 100) * period_ns)
        duty_cycle_path = os.path.join(self._get_channel_path(chip_id, channel_id), 'duty_cycle')

        # Write the duty cycle value
        self._echo(duty_cycle_path, duty_cycle_ns)

    def _get_chip_path(self, chip_id: int) -> str:
        return os.path.join(self.PWM_BASE_PATH, f'pwmchip{chip_id}')
    
    def _get_channel_path(self, chip_id: int, channel_id: int) -> str:
        return os.path.join(self._get_chip_path(chip_id), f'pwm{channel_id}')

    def _get_channel(self, chip_id: int, channel_id: int):
        chip = self._get_chip(chip_id)

        for channel in chip.channels:
            if channel.channel == channel_id:
                return channel
        
        return None

    def _get_chip(self, chip_id: int):
        for chip in self.chips:
            if chip.chip == chip_id:
                return chip
        return None

    def _echo(self, file: str, value: int):
        with open(file, 'w') as export_file:
            export_file.write(str(value))
    
    def _enumerate(self):
        for chip_entry in os.listdir(self.PWM_BASE_PATH):
            # Get the match of the chip
            chip_match = self.CHIP_REGEX.match(chip_entry)

            if chip_match:
                chip_number = int(chip_match.group(1))
                chip_path = os.path.join(self.PWM_BASE_PATH, chip_entry)

                npwm_path = os.path.join(chip_path, 'npwm')
                with open(npwm_path, 'r') as f:
                    npwm = int(f.read().strip())

                channels: List[PWMChannel] = []

                # Iterate over every channel
                export_path = os.path.join(chip_path, 'export')
                for channel_number in range(npwm):
                    pwm_channel_path = os.path.join(chip_path, f'pwm{channel_number}')
                    if not os.path.exists(pwm_channel_path):
                        # create the export
                        try:
                            self._echo(export_path, channel_number)
                        except OSError:
                            continue
                    
                    channels.append(PWMChannel(channel_number))

                self.chips.append(PWMChip(chip=chip_number, channels=channels))

pwm_manager = PWMManager()

pwm_manager.set_channel_frequency(2, 0, 60)
pwm_manager.set_channel_duty_cycle(2, 0, 50)
pwm_manager.enable_channel(2, 0)

time.sleep(15)

pwm_manager.disable_channel(2, 0)
