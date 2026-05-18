import collections
import logging
import logging.handlers
import multiprocessing
import multiprocessing.synchronize
import socket
import struct
import threading
import time

from backend_py.src.models import StreamEndpointModel
from backend_py.src.services.cameras.synchronized_camera import (
    CopiedFrame,
    SynchronizedCamera,
    V4L2Camera,
)

from .base_stream_engine import BaseStreamEngine, Stream


class StreamProcess:
    def __init__(
        self,
        streams: list[Stream],
        exit: multiprocessing.synchronize.Event,
        log_queue: multiprocessing.Queue,
    ) -> None:
        self.MTU = 1400
        self.SSRC = 0x445745  # "DWE"
        self.exit = exit

        self.streams = streams

        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.frame_queue: collections.deque[tuple[CopiedFrame, CopiedFrame]] = (
            collections.deque(maxlen=2)
        )

        self.synchronized_camera: SynchronizedCamera | None = None

        root_logger = logging.getLogger("dwe_os_2")

        self.logger = logging.getLogger("dwe_os_2.cameras.SynchronizedStreamEngine")

        # remove handlers so that logs don't print
        root_logger.handlers = []

        ipc_handler = logging.handlers.QueueHandler(log_queue)
        root_logger.addHandler(ipc_handler)

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

            # TODO: Add this back as IPC
            # self.synchronized_camera.on("frame_drop", lambda: self.emit("frame_drop"))
        except OSError as e:
            self.logger.error("Unable to open synchronized camera: '%s'", e)
            # if e.strerror:
            #     self.emit_error(e.strerror)
            pass

    # <AI-Assisted> Custom RTP improves performance compared to RTP class
    def _send_frame(
        self, frames: list[CopiedFrame], endpoint: StreamEndpointModel
    ) -> None:
        # TODO: change protocol to handle more than two cameras
        if len(frames) > 2:
            pass

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

    def run(self) -> None:
        if not self.synchronized_camera:
            return

        self.stream_thread = threading.Thread(target=self.stream_loop_)
        self.stream_thread.start()

        # We need to be careful about the blocking aspect of grab
        while not self.exit.is_set():
            frames = self.synchronized_camera.grab()
            if frames is None:
                time.sleep(1 / self.streams[0].interval.denominator)
                continue

            self.frame_queue.append((frames[0], frames[1]))

    def stream_loop_(self) -> None:
        while not self.exit.is_set():
            try:
                endpoint = self.streams[0].endpoints[0]
            except IndexError:
                # FIXME
                time.sleep(1 / self.streams[0].interval.denominator)
                continue
            # TODO: do not assume two
            try:
                (left, right) = self.frame_queue.popleft()
                # TODO: make less scuffed
                self._send_frame([left, right], endpoint)
            except IndexError:
                time.sleep(1 / self.streams[0].interval.denominator)
                continue


class SynchronizedStreamEngine(BaseStreamEngine):
    def __init__(self, streams, error_callback) -> None:
        super().__init__(streams, error_callback)

        self.log_queue = multiprocessing.Queue()
        root_logger = logging.getLogger("dwe_os_2")
        self.log_listener = logging.handlers.QueueListener(
            self.log_queue, *root_logger.handlers, respect_handler_level=True
        )
        self.log_listener.start()

        self.exit = multiprocessing.Event()
        self.process = multiprocessing.Process(
            target=self._create_process, args=(streams, self.exit, self.log_queue)
        )

    def start(self) -> None:
        self.process.start()

    def stop(self) -> None:
        self.exit.set()
        if self.process.is_alive():
            self.process.join()
        self.logger.info("Successfully stopped SynchronizedStreamEngine process")

    def _create_process(
        self,
        streams: list[Stream],
        exit: multiprocessing.synchronize.Event,
        log_queue: multiprocessing.Queue,
    ) -> None:
        process = StreamProcess(streams, exit, log_queue)
        process.run()
