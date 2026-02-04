"""
stream_runner.py
"""

import threading
import event_emitter as events
import logging
from .stream_engines.stream import Stream
from .stream_engines.base_stream_engine import BaseStreamEngine
from .stream_engines.synchronized_stream_engine import SynchronizedStreamEngine
from .stream_engines.gstreamer_stream_engine import GStreamerProcessEngine
import time


class StreamRunner(events.EventEmitter):
    """
    The main entry point. Automatically decides which engine to use based on usage.

    Streams are expected to be added dynamically. Calling start() will construct the correct engine on the fly with the provided streams.
    """

    def __init__(self, *streams: Stream) -> None:
        super().__init__()
        self.streams = list(streams)
        self.started = False
        self._lock = threading.RLock()
        self.logger = logging.getLogger("dwe_os_2.cameras.StreamRunner")

    def _select_engine(self) -> BaseStreamEngine:
        """Factory method to choose the correct streaming backend."""

        # Selecting engines like this is extremely naive, but works at the moment
        # Still infinitely better than only being able to do GStreamer as a backend
        # Ideally we would have a way for either the user or the backend to control

        if len(self.streams) > 1:
            self.logger.info(
                "Multiple streams detected: Using SynchronizedStreamEngine.")
            return SynchronizedStreamEngine(self.streams, self._on_engine_error)
        else:
            self.logger.info(
                "Single stream detected: Using GStreamerProcessEngine.")
            return GStreamerProcessEngine(self.streams, self._on_engine_error)

    def _on_engine_error(self, error_data):
        """Callback to bubble up errors from the engine to the runner's listeners."""
        # TODO: change to general stream error
        self.emit("stream_error", error_data)
        self.stop()

    def start(self):
        with self._lock:
            self.logger.info(
                f"Starting streams: {[s.device_path for s in self.streams]}")
            if self.started:
                self.stop()
                time.sleep(1)

            # We create the engine on start, so the engine can perform initial setup on constructor
            self.engine: BaseStreamEngine = self._select_engine()

            self.started = True
            # We don't need to catch exceptions, maybe remove later
            try:
                self.engine.start()
            except Exception as e:
                self.logger.error(f"Failed to start engine: {e}")
                self.started = False

    def stop(self):
        with self._lock:
            if not self.started:
                return

            self.logger.info("Stopping streams...")
            self.started = False
            self.engine.stop()
