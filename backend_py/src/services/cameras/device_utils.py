from typing import List
from .device import Device

def find_device_with_bus_info(devices: List[Device], bus_info: str) -> Device | None:
    for device in devices:
        if device.bus_info == bus_info:
            return device
    return None

def list_diff(listA, listB):
    # find the difference between lists
    diff = []
    for element in listA:
        if element not in listB:
            diff.append(element)
    return diff
