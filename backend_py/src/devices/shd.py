import logging

from ..enumeration import DeviceInfo
from ..device import Device

class SHDDevice(Device):
    '''
    Class for stellarHD devices
    '''

    def __init__(self, device_info: DeviceInfo, is_leader=True) -> None:
        super().__init__(device_info)
        self.is_leader = is_leader
        self.follower: str = None

    def set_follower(self, follower: 'SHDDevice'):
        # We love forward references
        if follower.is_leader:
            logging.warn('Attempting to add leader SHD as a follower, this is undefined behavior.')
            return
        self.follower = follower.bus_info
        self.stream_runner.streams.append(follower.stream)

    def start_stream(self):
        # do not stream if follower
        if not self.is_leader:
            logging.warn('Attempting to start stream as a follower. This is currently not allowed.')
            return
        super().start_stream()
