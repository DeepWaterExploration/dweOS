"""
stream_runner.py
"""

import logging
import threading
import time
from collections.abc import Callable

import event_emitter as events

from backend_py.src.models import StreamTypeEnum

from .stream_engines.base_stream_engine import BaseStreamEngine
from .stream_engines.gstreamer_stream_engine import GStreamerProcessEngine
from .stream_engines.stream import Stream
from .stream_engines.synchronized_stream_engine import SynchronizedStreamEngine


class StreamRunner(events.EventEmitter):
    """
    The main entry point. Automatically decides which engine to use based on usage.

    Streams are expected to be added dynamically. Calling start() will construct the
    correct engine on the fly with the provided streams.

    Recording streams run on a schedule: every record_interval seconds, a recording of
    record_duration seconds is made.
    """

    def __init__(self, *streams: Stream) -> None:
        super().__init__()
        self.streams = list(streams)
        self.started = False
        self.engine: BaseStreamEngine | None = None
        # Checked before and during scheduled recordings (e.g. for storage space)
        self.can_record: Callable[[], bool] = lambda: True
        self._schedule_stop = threading.Event()
        self._lock = threading.RLock()
        self.logger = logging.getLogger("dwe_os_2.cameras.StreamRunner")

    def _select_engine(self) -> BaseStreamEngine:
        """Factory method to choose the correct streaming backend."""

        # Selecting engines like this is extremely naive, but works at the moment
        # Still infinitely better than only being able to do GStreamer as a backend
        # Ideally we would have a way for either the user or the backend to control

        if len(self.streams) > 1:
            self.logger.info(
                "Multiple streams detected: Using SynchronizedStreamEngine."
            )
            return SynchronizedStreamEngine(self.streams, self._on_engine_error)
        else:
            self.logger.info("Single stream detected: Using GStreamerProcessEngine.")
            return GStreamerProcessEngine(self.streams, self._on_engine_error)

    def _on_engine_error(self, error_data) -> None:
        """Callback to bubble up errors from the engine to the runner's listeners."""
        self.emit("stream_error", error_data)
        self.stop()

    def start(self) -> None:
        with self._lock:
            self.logger.info(
                f"Starting streams: {','.join([s.device_path for s in self.streams])}"
            )
            if self.started:
                self.stop()

            self.started = True

            if self.streams[0].stream_type == StreamTypeEnum.RECORDING:
                self._schedule_stop = threading.Event()
                threading.Thread(
                    target=self._record_on_schedule,
                    args=(self._schedule_stop,),
                    daemon=True,
                ).start()
            else:
                self._start_engine()

    def _start_engine(self) -> BaseStreamEngine:
        # We create the engine on start, so the engine can perform initial setup on
        # constructor
        engine = self._select_engine()
        engine.on("frame_drop", lambda: self.emit("frame_drop"))
        self.engine = engine

        # We don't need to catch exceptions, maybe remove later
        try:
            engine.start()
            self.emit("started")
        except Exception as e:
            self.logger.error(f"Failed to start engine: {e}")
        return engine

    def _record_on_schedule(self, stop: threading.Event) -> None:
        stream = self.streams[0]
        # Start times follow a fixed grid so pipeline startup time does not add drift
        next_start = time.monotonic()
        while not stop.is_set():
            end = next_start + stream.record_duration
            next_start += stream.record_interval

            with self._lock:
                engine = None
                if not stop.is_set() and self.can_record():
                    engine = self._start_engine()

            if engine:
                # Wake up every second so the recording stops if storage runs low
                while not stop.wait(max(0, min(1, end - time.monotonic()))):
                    if time.monotonic() >= end or not self.can_record():
                        break
                engine.stop()

            stop.wait(max(0, next_start - time.monotonic()))

    def stop(self) -> None:
        with self._lock:
            if not self.started:
                return

            self.logger.info("Stopping streams...")
            self.started = False
            self._schedule_stop.set()
            if self.engine:
                self.engine.stop()
