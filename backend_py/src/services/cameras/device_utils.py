"""
device_utils.py

Utility functions for device_manager.py, specifically for finding added devices /
 removed devices
"""

from .drivers.device import Device


def find_device_with_bus_info(
    devices: dict[str, Device], bus_info: str
) -> Device | None:
    return devices.get(bus_info)


def list_diff(listA: list, listB: list) -> list:
    # find the difference between lists
    diff = []
    for element in listA:
        if element not in listB:
            diff.append(element)
    return diff
