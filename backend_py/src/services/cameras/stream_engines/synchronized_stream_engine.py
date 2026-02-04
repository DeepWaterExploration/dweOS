from ..synchronized_camera import V4L2Camera, SynchronizedCamera, CopiedFrame
from ..pydantic_schemas import StreamEndpointModel
from rtp import RTP
import time
import struct
import socket
import threading
import time
import collections
from typing import List

from .base_stream_engine import BaseStreamEngine
from .stream import Stream


class SynchronizedStreamEngine(BaseStreamEngine):

    def __init__(self, streams, error_callback):
        super().__init__(streams, error_callback)

        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.frame_queue: collections.deque[tuple[CopiedFrame]] = \
            collections.deque()

        self.MTU = 1400
        self.SSRC = 0x445745  # "DWE"

        self.stream_thread: threading.Thread | None = None
        self.capture_thread: threading.Thread | None = None
        self._running = False

        self.synchronized_camera = None

        # Always MJPEG
        try:
            self.cameras: List[V4L2Camera] = [V4L2Camera(
                stream.device_path, stream.width, stream.height, stream.interval.denominator) for stream in streams]
            self.synchronized_camera = SynchronizedCamera(self.cameras)
        except OSError as e:
            self.logger.error("Unable to open synchronized camera: '%s'", e)
            self.emit_error(e.strerror)
        

    def _send_frame(self, frames: List[CopiedFrame], endpoint: StreamEndpointModel):
        # TODO: change protocol to handle more than two cameras
        assert len(frames) == 2

        left_frame = frames[0]
        right_frame = frames[1]

        header = struct.pack("<QQ", len(left_frame.data),
                             len(right_frame.data))

        # Complete Payload: [Header][Left JPEG][Right JPEG]
        full_payload = header + left_frame.data + right_frame.data
        payload_size = len(full_payload)

        # Shared by all fragments
        timestamp = int(time.time() * 1000) & 0xFFFFFFFF
        bytes_sent = 0
        sequence_number = 1

        while bytes_sent < payload_size:
            # Determine chunk size
            chunk_end = min(bytes_sent + self.MTU, payload_size)
            chunk = full_payload[bytes_sent:chunk_end]

            # Determine if this is the LAST fragment (Marker Bit)
            is_last = (chunk_end == payload_size)

            # Create RTP Packet
            rtp_pkt = RTP(
                payload=bytearray(chunk),
                version=2,
                ssrc=self.SSRC,
                timestamp=timestamp,
                marker=is_last
            )

            self.socket.sendto(bytes(
                rtp_pkt), (endpoint.host, endpoint.port))

            bytes_sent = chunk_end
            sequence_number += 1

    def start(self):
        self.logger.info(
            f"Starting synchronized stream with: {(', '.join([stream.device_path for stream in self.streams]))}")
        # self.logger.warning("SynchronizedStreamEngine is not yet implemented")
        if len(self.streams) != 2:
            self.logger.error("SynchronizedStreamEngine cannot support more than 2 streams yet!")
            return
        
        if not self.synchronized_camera:
            self.logger.error("Synchronized camera does not exist. An error occurred previously in construction!")
            return

        self.capture_thread = threading.Thread(target=self.capture_loop_)
        self._running = True
        self.capture_thread.start()

        # We cannot handle more than 2 synchronized streams yet in the protocol
        self.stream_thread = threading.Thread(target=self.stream_loop_)
        self.stream_thread.start()

    def stop(self):
        try:
            self._running = False

            if self.capture_thread:
                self.capture_thread.join(timeout=1000)
            if self.stream_thread:
                self.stream_thread.join(timeout=1000)
        except TimeoutError as e:
            self.logger.error(
                f"Timeout exceeded while joining capture thread: {e}")

    def capture_loop_(self):
        # We need to be careful about the blocking aspect of grab
        while self._running:
            frames = self.synchronized_camera.grab()
            if frames is None:
                time.sleep(0.01)
                continue

            self.frame_queue.append([frames[0], frames[1]])
        self.synchronized_camera.stop()

    def stream_loop_(self):
        while self._running:
            try:
                endpoint = self.streams[0].endpoints[0]
            except IndexError:
                continue
            # TODO: do not assume two
            try:
                (left, right) = self.frame_queue.popleft()
                # TODO: make less scuffed
                self._send_frame([left, right], endpoint)
            except IndexError:
                time.sleep(0.01)
                continue
