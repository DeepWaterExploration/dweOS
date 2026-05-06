import collections
import socket
import struct
import threading
import time

from ..pydantic_schemas import StreamEndpointModel
from ..synchronized_camera import CopiedFrame, SynchronizedCamera, V4L2Camera
from .base_stream_engine import BaseStreamEngine


class SynchronizedStreamEngine(BaseStreamEngine):
    def __init__(self, streams, error_callback) -> None:
        super().__init__(streams, error_callback)

        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.frame_queue: collections.deque[tuple[CopiedFrame, CopiedFrame]] = (
            collections.deque(maxlen=2)
        )

        self.MTU = 1400
        self.SSRC = 0x445745  # "DWE"
        self.sequence_number = 1

        self.stream_thread: threading.Thread | None = None
        self.capture_thread: threading.Thread | None = None
        self._running = False

        self.synchronized_camera = None

        # Always MJPEG
        try:
            self.cameras: list[V4L2Camera] = [
                V4L2Camera(
                    stream.device_path,
                    stream.width,
                    stream.height,
                    stream.interval.denominator,
                )
                for stream in streams
            ]

            self.synchronized_camera = SynchronizedCamera(self.cameras)
            self.synchronized_camera.on("frame_drop", lambda: self.emit("frame_drop"))
        except OSError as e:
            self.logger.error("Unable to open synchronized camera: '%s'", e)
            if e.strerror:
                self.emit_error(e.strerror)

    # <AI-Assisted> Custom RTP improves performance compared to RTP class
    def _send_frame(
        self, frames: list[CopiedFrame], endpoint: StreamEndpointModel
    ) -> None:
        # TODO: change protocol to handle more than two cameras
        if len(frames) > 2:
            self.logger.warning(
                "Only 2 cameras are supported for synchronized streaming. "
                "This is an in progress feature- please contact us if you "
                "require it sooner."
            )

        left_frame = frames[0]
        right_frame = frames[1]

        # payload headers
        frame_header = struct.pack("<QQ", len(left_frame.data), len(right_frame.data))

        # Copy everything into a payload
        full_payload = frame_header + left_frame.data + right_frame.data
        payload_view = memoryview(full_payload)
        payload_size = len(payload_view)

        timestamp = int(time.time() * 1000) & 0xFFFFFFFF
        sequence_number = 1

        # Pre-pack the RTP header structure (Version 2, Payload 96 (dynamic), etc)
        # ! = network (big-endian), B = byte, H = short, I = int
        # V=2, P=0, X=0, CC=0 -> 0x80
        rtp_ver = 0x80
        rtp_type = 96

        offset = 0
        target_address = (endpoint.host, endpoint.port)

        while offset < payload_size:
            # Calculate chunk size
            remaining = payload_size - offset
            chunk_size = min(remaining, self.MTU)

            # Check if this is the last packet (Marker bit)
            marker_bit = 0
            if offset + chunk_size >= payload_size:
                marker_bit = 1

            # RTP Header packing
            m_pt = (marker_bit << 7) | rtp_type

            # Pack header: [Ver][Marker+PT][SeqNum][Timestamp][SSRC]
            rtp_header = struct.pack(
                "!BBHII", rtp_ver, m_pt, sequence_number, timestamp, self.SSRC
            )

            # Zero-copy slice using memoryview
            chunk_view = payload_view[offset : offset + chunk_size]

            # Send directly:
            self.socket.sendto(rtp_header + chunk_view, target_address)

            offset += chunk_size
            sequence_number = (sequence_number + 1) & 0xFFFF

    def start(self) -> None:
        self.logger.info(
            "Starting synchronized stream with: "
            f"{(', '.join([stream.device_path for stream in self.streams]))}"
        )
        # self.logger.warning("SynchronizedStreamEngine is not yet implemented")
        if len(self.streams) != 2:
            self.logger.error(
                "SynchronizedStreamEngine cannot support more than 2 streams yet!"
            )
            return

        if not self.synchronized_camera:
            self.logger.error(
                "Synchronized camera does not exist. An error occurred previously in "
                "construction!"
            )
            return

        self.capture_thread = threading.Thread(target=self.capture_loop_)
        self._running = True
        self.capture_thread.start()

        # We cannot handle more than 2 synchronized streams yet in the protocol
        self.stream_thread = threading.Thread(target=self.stream_loop_)
        self.stream_thread.start()

    def stop(self) -> None:
        try:
            self._running = False

            if self.capture_thread:
                self.capture_thread.join(timeout=1)
            if self.stream_thread:
                self.stream_thread.join(timeout=1)
        except TimeoutError as e:
            self.logger.error(f"Timeout exceeded while joining capture thread: {e}")

    def capture_loop_(self) -> None:
        if not self.synchronized_camera:
            self.logger.error(
                "Cannot run capture loop when synchronized camera is not defined!"
            )
            return

        # We need to be careful about the blocking aspect of grab
        while self._running:
            frames = self.synchronized_camera.grab()
            if frames is None:
                time.sleep(1 / self.streams[0].interval.denominator)
                continue

            self.frame_queue.append((frames[0], frames[1]))
        self.synchronized_camera.stop()

    def stream_loop_(self) -> None:
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
                time.sleep(1 / self.streams[0].interval.denominator)
                continue
