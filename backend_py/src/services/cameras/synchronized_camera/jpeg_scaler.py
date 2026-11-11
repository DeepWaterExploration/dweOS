"""
jpeg_scaler.py

Shrinks JPEG frames by a whole factor, so a synchronized camera can stream at a
fraction of the resolution it records at. The hardware JPEG codec is used when the
platform has one (Jetson), and libjpeg-turbo is used everywhere else
"""

from __future__ import annotations

import functools
import logging
import queue
import shutil
import subprocess
import threading
from abc import ABC, abstractmethod
from typing import BinaryIO

# Factors libjpeg-turbo can decode to directly, without a full size decode
SUPPORTED_SCALES = (1, 2, 4, 8)

JPEG_QUALITY = 80

logger = logging.getLogger("dwe_os_2.cameras.JpegScaler")


def scaled_size(width: int, height: int, scale: int) -> tuple[int, int]:
    """Size of a frame after scaling, rounded up the same way libjpeg-turbo does"""
    return (-(-width // scale), -(-height // scale))


class JpegScaler(ABC):
    name: str

    @abstractmethod
    def scale(self, data: bytes, width: int, height: int, scale: int) -> bytes:
        """Return the JPEG in data shrunk to 1/scale of width and height"""

    def close(self) -> None:  # noqa: B027 - most scalers have nothing to clean up
        pass


class TurboJpegScaler(JpegScaler):
    """
    Decodes straight to the reduced size in the DCT domain and re-encodes from YUV,
    which keeps the cost low enough for the CPU
    """

    name = "libjpeg-turbo"

    def __init__(self, quality: int = JPEG_QUALITY) -> None:
        # Imported here so a missing libturbojpeg only disables scaling
        from turbojpeg import TurboJPEG

        self._turbo = TurboJPEG()
        self._quality = quality

    def scale(self, data: bytes, width: int, height: int, scale: int) -> bytes:
        return self._turbo.scale_with_quality(
            data, scaling_factor=(1, scale), quality=self._quality
        )


class GStreamerJpegScaler(JpegScaler):
    """
    Scales with a hardware JPEG codec through a gst-launch process that stays
    running. Frames are written to stdin and read from stdout as multipart parts,
    which carry their length, so every frame comes back on its own and in order
    """

    name = "GStreamer"

    BOUNDARY = b"dweframe"
    # A frame that takes longer than this means the pipeline is stuck
    TIMEOUT_S = 1.0
    # The first frame also waits for the pipeline and codec to start
    STARTUP_TIMEOUT_S = 5.0

    def __init__(
        self,
        decoder: str,
        converter: str,
        encoder: str,
        raw_caps: str = "video/x-raw",
        quality: int = JPEG_QUALITY,
    ) -> None:
        self._decoder = decoder
        self._converter = converter
        self._encoder = encoder
        self._raw_caps = raw_caps
        self._quality = quality

        self._process: subprocess.Popen[bytes] | None = None
        self._frames: queue.Queue[bytes | None] = queue.Queue()
        # Input and output sizes the running pipeline was built for
        self._sizes: tuple[int, int, int, int] | None = None

    @classmethod
    def jetson(cls, quality: int = JPEG_QUALITY) -> GStreamerJpegScaler:
        scaler = cls(
            "nvjpegdec",
            "nvvidconv",
            "nvjpegenc",
            raw_caps="video/x-raw(memory:NVMM)",
            quality=quality,
        )
        scaler.name = "Jetson nvjpeg"
        return scaler

    @staticmethod
    def has_elements(*elements: str) -> bool:
        return _has_gstreamer_elements(elements)

    def scale(self, data: bytes, width: int, height: int, scale: int) -> bytes:
        out_width, out_height = scaled_size(width, height, scale)
        # Raw video has to be an even size
        out_width += out_width % 2
        out_height += out_height % 2

        sizes = (width, height, out_width, out_height)
        timeout = self.TIMEOUT_S
        if self._process is None or self._sizes != sizes:
            self._start(out_width, out_height)
            self._sizes = sizes
            timeout = self.STARTUP_TIMEOUT_S

        assert self._process is not None and self._process.stdin is not None
        try:
            self._process.stdin.write(
                b"--%s\r\nContent-Type: image/jpeg\r\nContent-Length: %d\r\n\r\n"
                % (self.BOUNDARY, len(data))
                + data
                + b"\r\n"
            )
            self._process.stdin.flush()
            frame = self._frames.get(timeout=timeout)
        except (OSError, queue.Empty) as e:
            self.close()
            raise RuntimeError(f"{self.name} pipeline did not return a frame") from e

        if frame is None:
            self.close()
            raise RuntimeError(f"{self.name} pipeline exited")
        return frame

    def close(self) -> None:
        if self._process is None:
            return
        self._process.kill()
        self._process.wait()
        self._process = None
        self._sizes = None

    def _build_command(self, out_width: int, out_height: int) -> list[str]:
        boundary = self.BOUNDARY.decode()
        pipeline = (
            f"fdsrc fd=0 ! multipartdemux single-stream=true boundary={boundary} ! "
            f"image/jpeg ! {self._decoder} ! {self._converter} ! "
            f"{self._raw_caps},width={out_width},height={out_height} ! "
            f"{self._encoder} quality={self._quality} ! "
            f"multipartmux boundary={boundary} ! fdsink fd=1 sync=false"
        )
        # Quiet, since status messages would otherwise be printed into the frames
        return ["gst-launch-1.0", "-q", *pipeline.split(" ")]

    def _start(self, out_width: int, out_height: int) -> None:
        self.close()

        command = self._build_command(out_width, out_height)
        logger.debug("Starting JPEG scaler: %s", " ".join(command))
        self._process = subprocess.Popen(
            command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        # A fresh queue, so a frame left over from an old pipeline is never returned
        self._frames = queue.Queue()

        assert self._process.stdout is not None and self._process.stderr is not None
        threading.Thread(
            target=self._read_frames,
            args=(self._process.stdout, self._frames),
            daemon=True,
        ).start()
        threading.Thread(
            target=self._log_errors, args=(self._process.stderr,), daemon=True
        ).start()

    def _read_frames(self, stdout: BinaryIO, frames: queue.Queue[bytes | None]) -> None:
        try:
            while True:
                frame = self._read_part(stdout)
                if frame is None:
                    break
                frames.put(frame)
        except (OSError, ValueError) as e:
            logger.warning("Unable to read from %s pipeline: %s", self.name, e)
        # Tells a waiting scale() that no more frames will come
        frames.put(None)

    def _read_part(self, stdout: BinaryIO) -> bytes | None:
        """Read one multipart part, or None when the pipeline closes"""
        line = stdout.readline()
        # Parts are separated by a blank line
        while line in (b"\r\n", b"\n"):
            line = stdout.readline()
        if not line:
            return None
        if line.strip() != b"--" + self.BOUNDARY:
            raise ValueError(f"Unexpected multipart boundary: {line!r}")

        length: int | None = None
        while (line := stdout.readline().strip()) != b"":
            name, _, value = line.partition(b":")
            if name.strip().lower() == b"content-length":
                length = int(value)
        if length is None:
            raise ValueError("Multipart part has no Content-Length")

        data = bytearray()
        while len(data) < length:
            chunk = stdout.read(length - len(data))
            if not chunk:
                return None
            data += chunk
        return bytes(data)

    def _log_errors(self, stderr: BinaryIO) -> None:
        for line in stderr:
            logger.warning("%s: %s", self.name, line.decode(errors="replace").rstrip())


@functools.cache
def _has_gstreamer_elements(elements: tuple[str, ...]) -> bool:
    if not shutil.which("gst-inspect-1.0"):
        return False
    for element in elements:
        try:
            result = subprocess.run(
                ["gst-inspect-1.0", element],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=10,
            )
        except (OSError, subprocess.TimeoutExpired):
            return False
        if result.returncode != 0:
            return False
    return True


class AutoJpegScaler(JpegScaler):
    """
    Uses the hardware codec when the platform has one, and falls back to
    libjpeg-turbo if it is missing or fails. Frames are passed through at full
    size if nothing can scale them
    """

    name = "auto"

    def __init__(self, quality: int = JPEG_QUALITY) -> None:
        self._quality = quality
        self._candidates = [self._create_jetson, self._create_turbo]
        self._active: JpegScaler | None = None
        self._next_backend()

    def scale(self, data: bytes, width: int, height: int, scale: int) -> bytes:
        if scale == 1:
            return data
        if scale not in SUPPORTED_SCALES:
            raise ValueError(f"Unsupported stream scale: {scale}")

        while self._active is not None:
            try:
                return self._active.scale(data, width, height, scale)
            except Exception as e:
                logger.warning("%s could not scale a frame: %s", self._active.name, e)
                self._active.close()
                self._next_backend()
        return data

    def close(self) -> None:
        if self._active is not None:
            self._active.close()

    def _next_backend(self) -> None:
        self._active = None
        while self._candidates:
            scaler = self._candidates.pop(0)()
            if scaler is not None:
                logger.info("Scaling streamed frames with %s", scaler.name)
                self._active = scaler
                return
        logger.error("No JPEG scaler is available, so frames are streamed full size")

    def _create_jetson(self) -> JpegScaler | None:
        if not GStreamerJpegScaler.has_elements("nvjpegdec", "nvvidconv", "nvjpegenc"):
            return None
        return GStreamerJpegScaler.jetson(self._quality)

    def _create_turbo(self) -> JpegScaler | None:
        try:
            return TurboJpegScaler(self._quality)
        except (ImportError, OSError, RuntimeError) as e:
            logger.warning("libjpeg-turbo is unavailable: %s", e)
            return None
