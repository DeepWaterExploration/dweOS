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
        self.leader: str = None
        self.leader_device: 'SHDDevice' = None

    def set_leader(self, leader: 'SHDDevice'):
        # We love forward references
        if not leader.is_leader:
            logging.warn('Attempting to add follower SHD as a leader, this is undefined behavior and will not be permitted.')
            return
        self.leader_device = leader
        self.leader = leader.bus_info
        # remember to stop the stream because it is no longer managed by this device
        self.stream_runner.stop()
        if len(leader.stream_runner.streams) < 2:
            leader.stream_runner.streams.append(self.stream)
        else:
            leader.stream_runner.streams[1] = self.stream
        
        # restart leader's stream to now include this device
        leader.start_stream()

    def remove_leader(self):
        self.leader_device.stream_runner.streams.remove(self.stream)
        self.leader_device = None
        self.leader = None

    def start_stream(self):
        if not self.is_leader:
            if self.leader:
                logging.info('Starting stream as a follower. This will start the leader\'s stream')
                self.leader_device.start_stream()
                return
        super().start_stream()
