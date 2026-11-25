"""
software_ae.py

Software auto exposure for synchronized stellarHD cameras. Meters the
synchronized frames and gives every camera in the group the same exposure time
and strobe width. Gain (ISO) is left at the user's value.
"""

from __future__ import annotations

import io
import logging
import math
import threading
import time
from collections.abc import Callable
from typing import TYPE_CHECKING

from PIL import Image

from ..xu import StellarSensorMap

if TYPE_CHECKING:
    from ...synchronized_camera import CopiedFrame
    from ..asic_interface import ASICInterface

# Keep in sync with FPS_TO_MAX_EXPOSURE and STROBE_MULTIPLIER in the frontend
# (sensor-controls.ts)
FPS_TO_MAX_EXPOSURE = {
    60: 1462,
    50: 1756,
    40: 2119,
    30: 2942,
    15: 5884,
    10: 5884,
    5: 5884,
}
STROBE_MULTIPLIER = {60: 1, 50: 1, 40: 1, 30: 2, 15: 3.75, 10: 3.75, 5: 6}
STROBE_WIDTH_MAX = 4095
# The longest exposure is VTS - 13 lines. The firmware sets VTS, and it does not
# always match the table above (1475 at 30 fps on some firmware)
VTS_EXPOSURE_MARGIN = 13

# Upper bound on control updates. Lower frame rates update once per frame
RATE_HZ = 60
# Frames captured sooner than this after a write are not metered. A group hold
# write first shows 2 frames later (measured), so 3 leaves one frame of margin.
# Below 2 the loop steps again on stale frames and overshoots
SETTLE_FRAMES = 3
# Part of the brightness error corrected per update. 0.8 settles in 4-6
# updates without overshoot
LOOP_GAIN = 0.8
# Mean luma grows like light ** RESPONSE_EXPONENT (JPEG gamma, measured 0.43-0.51
# below luma 150, lower above). The error is divided by it, so LOOP_GAIN is the
# part of the error in light that is corrected
RESPONSE_EXPONENT = 0.5
# Errors smaller than this are ignored so the loop does not hunt (in EV)
DEADBAND_EV = 0.08
MAX_STEP_EV = 1.0
# Highlight limit: the brightest HIGHLIGHT_FRACTION of pixels should stay at or
# below HIGHLIGHT_TARGET. Whichever of this and the mean asks for less light
# wins, so the loop settles at the limit instead of bouncing across it.
# 255 turns it off
HIGHLIGHT_FRACTION = 0.02
HIGHLIGHT_TARGET = 235
# At or above this the highlights are saturated and give no error size, so step
# down by CLIP_STEP_EV
CLIP_LEVEL = 250
CLIP_STEP_EV = -0.25
# libjpeg DCT scaling: 1600x1200 meters as 200x150
DECODE_SCALE = 8
# Latch exposure and strobe on the same frame
USE_GROUP_HOLD = True
# Shortest time between UI updates
PUBLISH_INTERVAL_S = 1.0

DEFAULT_TARGET = 115
QUEUE_KEY = "software_ae"


def luma_histogram(jpeg: bytes) -> list[int]:
    """
    256-bin luma histogram of a JPEG, decoded in grayscale at 1/DECODE_SCALE
    """
    with Image.open(io.BytesIO(jpeg)) as image:
        image.draft("L", (image.width // DECODE_SCALE, image.height // DECODE_SCALE))
        return image.convert("L").histogram()


def percentile(hist: list[int], total: int, fraction: float) -> int:
    """
    Luma level below which `fraction` of the pixels fall
    """
    threshold = fraction * total
    count = 0
    for level, n in enumerate(hist):
        count += n
        if count >= threshold:
            return level
    return len(hist) - 1


def split_light(light: float, fps: int, max_exposure: int) -> tuple[int, int]:
    """
    Convert a light level (strobe width units) into (exposure, strobe width).
    The strobe carries the light. The exposure is the shortest that contains the
    strobe, which keeps out ambient light and motion blur. Past the strobe
    limit, the exposure grows on its own.
    """
    mult = STROBE_MULTIPLIER[fps]
    strobe = min(round(light), STROBE_WIDTH_MAX)
    exposure = min(max(math.ceil(light / mult), 1), max_exposure)
    return exposure, strobe


def max_light(fps: int, max_exposure: int) -> float:
    return max_exposure * STROBE_MULTIPLIER[fps]


def _write_list(exposure: int, strobe: int) -> list[tuple[int, bytes]]:
    return [
        (StellarSensorMap.SHUTTER_HIGH, exposure.to_bytes(2, "big")),
        (StellarSensorMap.STROBE_WIDTH_HIGH, strobe.to_bytes(2, "big")),
    ]


class SoftwareAutoExposure:
    """
    Runs the control loop in its own thread. The capture thread hands frames to
    submit(), which only keeps the newest set, so capture never waits on AE.
    """

    def __init__(
        self,
        get_interfaces: Callable[[], list[ASICInterface]],
        get_fps: Callable[[], int],
        on_update: Callable[[int, int], None],
        name: str,
    ) -> None:
        self._get_interfaces = get_interfaces
        self._get_fps = get_fps
        self._on_update = on_update

        self.target = DEFAULT_TARGET

        self._latest: list[CopiedFrame] | None = None
        self._new_frames = threading.Event()
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None
        self._lock = threading.Lock()

        self._light = 1.0
        self._applied: tuple[int, int] | None = None
        self._settle_until_us = 0
        self._pending_publish = False
        self._last_publish = 0.0
        self._warned_fps: int | None = None
        # (fps, longest exposure) read from the sensor
        self._exposure_limit: tuple[int, int] | None = None

        self.logger = logging.getLogger(f"dwe_os_2.cameras.SoftwareAE.{name}")

    @property
    def running(self) -> bool:
        return self._thread is not None

    def start(self, exposure: int, strobe: int) -> None:
        """
        Start from the current exposure and strobe width
        """
        with self._lock:
            if self._thread:
                return
            # With a strobe, it carries the light. Without one, keep the exposure
            fps = self._get_fps()
            mult = STROBE_MULTIPLIER.get(fps, 1)
            self._light = float(strobe if strobe > 0 else exposure * mult)
            self._applied = (exposure, strobe)
            self._settle_until_us = 0
            self._latest = None
            self._stop.clear()
            self._thread = threading.Thread(target=self._run, daemon=True)
            self._thread.start()
        self.logger.info("Software auto exposure started")

    def stop(self) -> None:
        with self._lock:
            thread = self._thread
            if not thread:
                return
            self._thread = None
            self._stop.set()
            self._new_frames.set()
        thread.join()
        self._publish(force=True)
        self.logger.info("Software auto exposure stopped")

    def submit(self, frames: list[CopiedFrame]) -> None:
        """
        Called from the capture thread with each synchronized frame set
        """
        if self._thread is None:
            return
        self._latest = frames
        self._new_frames.set()

    def _run(self) -> None:
        period = 1 / RATE_HZ
        while not self._stop.is_set():
            if not self._new_frames.wait(timeout=0.5):
                continue
            self._new_frames.clear()
            frames = self._latest
            if self._stop.is_set() or frames is None:
                continue

            started = time.monotonic()
            try:
                self._step(frames)
            except Exception:
                self.logger.exception("Software auto exposure step failed")
            self._publish()

            # Wait out the rest of the period. Newer frames replace older ones
            self._stop.wait(max(0.0, period - (time.monotonic() - started)))

    def _step(self, frames: list[CopiedFrame]) -> None:
        fps = self._get_fps()
        if fps not in FPS_TO_MAX_EXPOSURE:
            if self._warned_fps != fps:
                self.logger.warning("No exposure limits for %s fps, AE paused", fps)
                self._warned_fps = fps
            return

        # Skip frames exposed before the last change took effect. V4L2 (uvcvideo)
        # timestamps use the monotonic clock
        now_us = time.monotonic_ns() // 1000
        captured_us = min(frame.timestamp_us for frame in frames)
        if abs(now_us - captured_us) > 5_000_000:
            captured_us = now_us  # not a monotonic timestamp
        if captured_us < self._settle_until_us:
            return

        hist = [0] * 256
        for frame in frames:
            for level, count in enumerate(luma_histogram(frame.data)):
                hist[level] += count
        total = sum(hist)
        if total == 0:
            return

        mean = sum(level * count for level, count in enumerate(hist)) / total
        highlight = percentile(hist, total, 1 - HIGHLIGHT_FRACTION)

        error_ev = math.log2(self.target / max(mean, 1.0)) / RESPONSE_EXPONENT
        if HIGHLIGHT_TARGET < 255:
            if highlight >= CLIP_LEVEL:
                highlight_ev = CLIP_STEP_EV
            else:
                highlight_ev = (
                    math.log2(HIGHLIGHT_TARGET / max(highlight, 1)) / RESPONSE_EXPONENT
                )
            error_ev = min(error_ev, highlight_ev)
        if abs(error_ev) < DEADBAND_EV:
            return

        step_ev = max(-MAX_STEP_EV, min(MAX_STEP_EV, LOOP_GAIN * error_ev))
        # Clamping the light level stops it winding up past the limits
        max_exposure = self._max_exposure(fps)
        limit = max_light(fps, max_exposure)
        self._light = max(1.0, min(self._light * 2**step_ev, limit))
        self.logger.debug(
            "mean=%.1f highlight=%d err=%+.2fEV step=%+.2fEV light=%.0f",
            mean,
            highlight,
            error_ev,
            step_ev,
            self._light,
        )

        exposure, strobe = split_light(self._light, fps, max_exposure)
        if (exposure, strobe) == self._applied:
            return
        self._apply(exposure, strobe, brighter=step_ev > 0)
        self._settle_until_us = now_us + SETTLE_FRAMES * 1_000_000 // fps

    def _max_exposure(self, fps: int) -> int:
        """
        Longest exposure that still adds light, from the sensor's VTS. Longer
        values are accepted but do nothing, so the loop would wind up past them
        """
        if self._exposure_limit and self._exposure_limit[0] == fps:
            return self._exposure_limit[1]

        limit = FPS_TO_MAX_EXPOSURE[fps]
        vts = [
            interface.sensor_read_high_low(
                StellarSensorMap.VTS_HIGH, StellarSensorMap.VTS_LOW
            )
            for interface in self._get_interfaces()
        ]
        if vts and all(vts):
            limit = min(limit, min(v for v in vts if v) - VTS_EXPOSURE_MARGIN)
        else:
            self.logger.warning("Unable to read VTS, using the exposure table")
        self.logger.info("Longest exposure at %s fps: %s", fps, limit)
        self._exposure_limit = (fps, limit)
        return limit

    def _apply(self, exposure: int, strobe: int, brighter: bool) -> None:
        writes = _write_list(exposure, strobe)
        # Without group hold, order the writes so the strobe always fits inside
        # the exposure: lengthen the exposure first, shorten the strobe first
        if not brighter:
            writes.reverse()

        # Each camera has its own worker, so the cameras are written in parallel.
        # A newer value replaces one that has not been written yet
        for interface in self._get_interfaces():
            interface.queue_command(
                QUEUE_KEY,
                interface.sync_sensor_write_many,
                [writes, USE_GROUP_HOLD],
            )

        self._applied = (exposure, strobe)
        self._pending_publish = True

    def _publish(self, force: bool = False) -> None:
        if not self._pending_publish or not self._applied:
            return
        now = time.monotonic()
        if not force and now - self._last_publish < PUBLISH_INTERVAL_S:
            return
        self._pending_publish = False
        self._last_publish = now
        self._on_update(*self._applied)
