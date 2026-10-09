import os
import signal
import subprocess
import threading
from collections.abc import Callable
from datetime import datetime

from backend_py.src.models import StreamEncodeTypeEnum, StreamTypeEnum
from backend_py.src.services.recordings import RecordingsService

from .base_stream_engine import BaseStreamEngine
from .stream import Stream


class GStreamerPipelineBuilder:
    """
    Responsible for creation of GStreamer pipelines based on a Stream configuraiton
    """

    @classmethod
    def build(cls, stream: Stream) -> str:
        source = cls._build_source(stream)
        caps = GStreamerPipelineBuilder._construct_caps(stream)
        payload = GStreamerPipelineBuilder._build_payload(stream)
        sink = GStreamerPipelineBuilder._build_sink(stream, RecordingsService.BASE_PATH)
        return f"{source} ! {caps} ! {payload} ! {sink}"

    @staticmethod
    def _get_format(stream: Stream) -> str:
        match stream.encode_type:
            case StreamEncodeTypeEnum.H264:
                return "video/x-h264"
            case StreamEncodeTypeEnum.MJPG:
                return "image/jpeg"
            case StreamEncodeTypeEnum.SOFTWARE_H264:
                return "image/jpeg"  # from jpeg to h.264
            case _:
                return ""

    @staticmethod
    def _build_source(stream: Stream) -> str:
        return f"v4l2src device={stream.device_path}"

    @staticmethod
    def _construct_caps(stream: Stream) -> str:
        return (
            f"{GStreamerPipelineBuilder._get_format(stream)},width={stream.width},"
            f"height={stream.height},framerate={stream.interval.denominator}/{stream.interval.numerator}"
        )

    @staticmethod
    def _build_payload(stream: Stream) -> str:
        match stream.encode_type:
            case StreamEncodeTypeEnum.H264:
                if stream.stream_type == StreamTypeEnum.RECORDING:
                    return (
                        f"h264parse ! video/x-h264,width={stream.width},"
                        f"height={stream.height},"
                        f"framerate={stream.interval.denominator}/"
                        f"{stream.interval.numerator} ! queue ! mp4mux"
                    )
                else:
                    return "h264parse ! queue ! rtph264pay config-interval=10 pt=96"
            case StreamEncodeTypeEnum.MJPG:
                if stream.stream_type == StreamTypeEnum.RECORDING:
                    return "queue ! avimux"
                else:
                    return "rtpjpegpay"
            case StreamEncodeTypeEnum.SOFTWARE_H264:
                if stream.stream_type == StreamTypeEnum.RECORDING:
                    # FIXME: This was done to make it not exceed the 88 char limit for
                    # ruff. It looks bad, and can be solved with a better formatting
                    # system.
                    return (
                        "jpegdec ! queue ! "
                        "x264enc byte-stream=false tune=zerolatency "
                        f"bitrate={stream.software_h264_bitrate} "
                        "speed-preset=ultrafast ! "
                        "h264parse ! video/x-h264,"
                        f"width={stream.width},height={stream.height},"
                        f"framerate={stream.interval.denominator}"
                        f"/{stream.interval.numerator} ! queue ! mp4mux"
                    )
                else:
                    return (
                        "jpegdec ! queue ! x264enc byte-stream=true "
                        f"tune=zerolatency bitrate={stream.software_h264_bitrate} "
                        "speed-preset=ultrafast ! rtph264pay "
                        "config-interval=10 pt=96"
                    )
            case _:
                return ""

    @staticmethod
    def _build_sink(stream: Stream, recording_directory: str) -> str:
        match stream.stream_type:
            case StreamTypeEnum.UDP:
                if len(stream.endpoints) == 0:
                    return "fakesink"
                sink = "multiudpsink sync=true clients="
                sink += ",".join(f"{e.host}:{e.port}" for e in stream.endpoints)
                return sink
            case StreamTypeEnum.RECORDING:
                extension = (
                    "avi" if stream.encode_type == StreamEncodeTypeEnum.MJPG else "mp4"
                )
                timestamp = datetime.now().strftime("%F-%T")
                unique_filename = (
                    f"{stream.device_path.split('/')[-1]}_{timestamp}.{extension}"
                )
                unique_path = os.path.join(recording_directory, unique_filename)
                stream.file_path = unique_path
                return f"filesink location={unique_path} sync=true"
            case _:
                return ""


class GStreamerProcessEngine(BaseStreamEngine):
    """
    GStreamer stream Engine
    """

    def __init__(
        self, streams: list[Stream], error_callback: Callable[[str], None]
    ) -> None:
        super().__init__(streams, error_callback)

        self._process: subprocess.Popen | None = None
        self._error_thread: threading.Thread | None = None
        self._lock = threading.RLock()
        self.started = False

        # Interval recording
        self.recording_length = streams[0].recording_length
        self.recording_interval = streams[0].recording_interval

        if self.recording_interval <= self.recording_length:
            self.emit_error(
                "Recording interval must be greater than the recording length"
            )

        self._scheduler: threading.Thread | None = None

        self.has_recording_stream = any(
            stream.stream_type == StreamTypeEnum.RECORDING for stream in self.streams
        )

        # Behavior:
        # - Thread waits until stop thread is set
        # - If it is set, we stop the recording prematurely
        # - If it is not set, we continue with the interval
        # Not relevant for non recording streams
        self._stop_flag = threading.Event()

    def start(self) -> None:
        self.stop()

        with self._lock:
            self.logger.info(
                "Starting stream for devices: "
                f"{', '.join([stream.device_path for stream in self.streams])}"
            )
            self.started = True

            self._stop_flag.clear()
            self._scheduler = threading.Thread(target=self._schedule_loop, daemon=True)
            self._scheduler.start()

    def _schedule_loop(self) -> None:
        if (
            self.has_recording_stream
            and self.recording_interval != 0
            and self.recording_length != 0
        ):
            while True:
                self.logger.info("Starting recording interval!")

                self._run_pipeline()

                if self._stop_flag.wait(self.recording_length):
                    break

                self.logger.info("Stopping recording interval!")
                self._terminate_process()

                if self._stop_flag.wait(
                    self.recording_interval - self.recording_length
                ):
                    break
            self._terminate_process()
        else:
            # Simply run it
            self._run_pipeline()

    def _run_pipeline(self) -> None:
        with self._lock:
            if self._stop_flag.is_set():
                return

            pipeline_str = self._construct_pipeline()
            self.logger.info(pipeline_str)
            has_recording_stream = any(
                stream.stream_type == StreamTypeEnum.RECORDING
                for stream in self.streams
            )
            self._process = subprocess.Popen(
                [
                    "gst-launch-1.0",
                    f"{'-e' if has_recording_stream else ''}",  # EOS on shutdown
                    *pipeline_str.split(" "),
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                text=True,
            )
            self._error_thread = threading.Thread(target=self._monitor_stderr)
            self._error_thread.start()

    def _terminate_process(self) -> None:
        self.logger.info("Trying to stop process")
        with self._lock:
            if not self._process:
                return

            # For recording streams, send EOS to properly finalize the file
            has_recording_stream = any(
                stream.stream_type == StreamTypeEnum.RECORDING
                for stream in self.streams
            )

            try:
                if has_recording_stream:
                    self._process.send_signal(signal.SIGINT)  # EOS signal
                    self._process.wait(timeout=10)
                else:
                    self._process.terminate()
                    self._process.wait(timeout=5)
            except Exception as e:
                self.logger.error(f"Error during stop: {e}")
                self._process.kill()
            finally:
                if self._process.stderr:
                    self._process.stderr.close()
                self._process = None

    def stop(self) -> None:
        with self._lock:
            if not self.started or not self._process:
                return

            self.logger.info("Stopping stream")
            self.started = False

            self._stop_flag.set()

            self._terminate_process()

            scheduler, self._scheduler = self._scheduler, None

        if scheduler and scheduler is not threading.current_thread():
            scheduler.join()

    def _construct_pipeline(self) -> str:
        parts = [GStreamerPipelineBuilder.build(s) for s in self.streams]
        return " ".join(parts)

    def _monitor_stderr(self) -> None:
        process = self._process
        if not process or not process.stderr:
            self.logger.error(
                "Unable to monitor stderr. Is the GStreamer process running?"
            )
            return

        error_block = []
        for line in iter(process.stderr.readline, ""):
            stripped = line.strip()
            if any(
                k in stripped.lower()
                for k in ("error", "failed", "warning", "critical")
            ):
                error_block.append(stripped)

        return_code = process.wait()

        with self._lock:
            # If _terminate_process() already cleared/replaced it, we stopped it
            intentional = self._process is not process
            if intentional or not self.started or return_code == 0:
                return
            self.started = False
            self._process = None
            self._stop_flag.set()

        self.logger.error(f"GStreamer process crashed with return code: {return_code}")
        for error in error_block:
            self.logger.error(error)
        self.emit_error(f"Process exited with code {return_code}.")
