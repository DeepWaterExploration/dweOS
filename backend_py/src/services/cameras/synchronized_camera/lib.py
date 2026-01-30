# lib.py
#
# Minimal Python V4L2 capture + multi-camera synchronizer

import os
import fcntl
import mmap
import time
from dataclasses import dataclass
from collections import deque
from typing import List, Optional
import ctypes

from .. import v4l2


@dataclass
class CopiedFrame:
    """A frame copied from the kernel

    Attributes:
        data             JPEG encoded data
        width            width of frame
        height           height of frame
        pixel_format     number defining the format of the image (currently always jpeg)
        timestamp_us     the timestamp of the frame in microseconds
    """
    data: bytes
    width: int
    height: int
    pixel_format: int
    timestamp_us: int


class V4L2Camera:
    """
    Python V4L2 camera wrapper using mmap buffers.
    """

    def __init__(self, device: str,
                 width: int,
                 height: int,
                 fps: int,
                 pixel_format: int = v4l2.V4L2_PIX_FMT_MJPEG,
                 buffer_count: int = 4):

        self.device = device
        self.width = width
        self.height = height
        self.fps = fps
        self.pixel_format = pixel_format
        self.buffer_count = buffer_count

        self.fd = os.open(device, os.O_RDWR | os.O_NONBLOCK)
        self._buffers = []  # list[mmap.mmap]
        self._running = False

        self._set_format()
        self._set_fps()
        self._request_and_map_buffers()
        self._queue_all_buffers()
        self._start_stream()

    def _ioctl(self, req, arg):
        return fcntl.ioctl(self.fd, req, arg)

    def _set_format(self):
        fmt = v4l2.v4l2_format()
        fmt.type = v4l2.V4L2_BUF_TYPE_VIDEO_CAPTURE
        fmt.fmt.pix.width = self.width
        fmt.fmt.pix.height = self.height
        fmt.fmt.pix.pixelformat = self.pixel_format
        fmt.fmt.pix.field = v4l2.V4L2_FIELD_NONE

        self._ioctl(v4l2.VIDIOC_S_FMT, fmt)

    def _set_fps(self):
        parm = v4l2.v4l2_streamparm()
        parm.type = v4l2.V4L2_BUF_TYPE_VIDEO_CAPTURE

        # Query current params
        self._ioctl(v4l2.VIDIOC_G_PARM, parm)

        # Check capability
        if not (parm.parm.capture.capability & v4l2.V4L2_CAP_TIMEPERFRAME):
            raise RuntimeError(
                "Camera does not support FPS control (TIMEPERFRAME).")

        parm.parm.capture.timeperframe.numerator = 1
        parm.parm.capture.timeperframe.denominator = self.fps

        self._ioctl(v4l2.VIDIOC_S_PARM, parm)

    def _request_and_map_buffers(self):
        req = v4l2.v4l2_requestbuffers()
        req.count = self.buffer_count
        req.type = v4l2.V4L2_BUF_TYPE_VIDEO_CAPTURE
        req.memory = v4l2.V4L2_MEMORY_MMAP

        self._ioctl(v4l2.VIDIOC_REQBUFS, req)

        if req.count != self.buffer_count:
            # Count: `The number of buffers requested or granted.` (can rarely change after request)
            # Driver might reduce the buffer count?
            # Might want to research this, because I'd bet it only happens with EXTREMELY large buffer counts
            self.buffer_count = req.count

        self._buffers = []

        for i in range(self.buffer_count):
            buf = v4l2.v4l2_buffer()
            buf.type = v4l2.V4L2_BUF_TYPE_VIDEO_CAPTURE
            buf.memory = v4l2.V4L2_MEMORY_MMAP
            buf.index = i

            self._ioctl(v4l2.VIDIOC_QUERYBUF, buf)

            # Map the buffer
            mm = mmap.mmap(
                self.fd,
                buf.length,
                mmap.MAP_SHARED,
                mmap.PROT_READ | mmap.PROT_WRITE,
                offset=buf.m.offset,
            )
            self._buffers.append(mm)

    def _queue_all_buffers(self):
        for i in range(self.buffer_count):
            buf = v4l2.v4l2_buffer()
            buf.type = v4l2.V4L2_BUF_TYPE_VIDEO_CAPTURE
            buf.memory = v4l2.V4L2_MEMORY_MMAP
            buf.index = i
            self._ioctl(v4l2.VIDIOC_QBUF, buf)

    def _start_stream(self):
        buf_type = ctypes.c_int(v4l2.V4L2_BUF_TYPE_VIDEO_CAPTURE)
        self._ioctl(v4l2.VIDIOC_STREAMON, buf_type)
        self._running = True

    def _stop_stream(self):
        if not self._running:
            return
        buf_type = ctypes.c_int(v4l2.V4L2_BUF_TYPE_VIDEO_CAPTURE)
        self._ioctl(v4l2.VIDIOC_STREAMOFF, buf_type)
        self._running = False

    # Public API

    def grab_copied_frame(self, blocking: bool = True, timeout_s: float = 1.0) -> Optional[CopiedFrame]:
        """
        Dequeue one buffer, copy its contents into a new bytes object,
        requeue the buffer, and return a CopiedFrame.

        If blocking=False, returns None immediately if no frame is ready.
        """
        buf = v4l2.v4l2_buffer()
        buf.type = v4l2.V4L2_BUF_TYPE_VIDEO_CAPTURE
        buf.memory = v4l2.V4L2_MEMORY_MMAP

        # We emulate blocking behavior with a small poll loop
        # Actual polling is possible but not needed
        start_time = time.time()
        while True:
            try:
                self._ioctl(v4l2.VIDIOC_DQBUF, buf)
                break
            except OSError as e:
                if not blocking:
                    return None
                if timeout_s is not None and (time.time() - start_time) > timeout_s:
                    return None
                # EAGAIN: no buffer ready yet, sleep a bit
                # FIXME: I don't really like this, but it'll do for the time being
                time.sleep(0.001)

        mm = self._buffers[buf.index]
        # Copy only the used bytes
        frame_bytes = mm[:buf.bytesused]
        # Convert timeval (tv_sec, tv_usec) to microseconds
        ts_us = buf.timestamp.secs * 1_000_000 + buf.timestamp.usecs

        # Requeue the buffer immediately
        self._ioctl(v4l2.VIDIOC_QBUF, buf)

        return CopiedFrame(
            data=bytes(frame_bytes),
            width=self.width,
            height=self.height,
            pixel_format=self.pixel_format,
            timestamp_us=ts_us,
        )

    def close(self):
        self._stop_stream()

        # Unmap buffers
        for mm in self._buffers:
            try:
                mm.close()
            except Exception:
                pass

        self._buffers.clear()

        if self.fd is not None:
            os.close(self.fd)
            self.fd = None

    def __enter__(self):
        # Cool
        return self

    def __exit__(self, exc_type, exc, tb):
        # We don't use this, but is useful in the case of with v4l2_camera as...
        self.close()


class SynchronizedCamera:
    """
    Synchronized Camera Class
    """

    def __init__(self,
                 cameras: List[V4L2Camera],
                 sync_threshold_us: int = 16667,  # ~1 frame at 60 FPS
                 queue_cap: int = 8):
        self.cameras = cameras
        self.sync_threshold_us = sync_threshold_us
        self.queue_cap = queue_cap
        self.queues: List[deque[CopiedFrame]] = [
            deque() for _ in cameras
        ]

        # For those curious about the synchronization logic, it can be summarized as follows:
        # The synch threshold is **NOT** the precision. It is generally specified as 1/FPS.
        # For 60 fps, this is 16667. If synchronized to within 1/FPS, the frames can be considered synchronized at the sensor level.
        # The frames are captured at precisely the same time, but become jumbled when they reach the userspace API.
        # As the Linux kernel is not an RTOS, we have no way of strictly forcing provided frames to be synchronized,
        # but we can make it happen after the fact with kernel timestamps.

    def camera_count(self) -> int:
        return len(self.cameras)

    def _queues_full(self) -> bool:
        return all(len(q) > 0 for q in self.queues)

    def stop(self):
        for cam in self.cameras:
            cam.close()

    def grab(self) -> Optional[List[CopiedFrame]]:
        """
        Grab and synchronize frames from all cameras.
        Returns a list[CopiedFrame] of length camera_count() if synced,
        or None if sync not achieved yet.
        """

        # grab one frame from each camera
        grabbed_frames: List[Optional[CopiedFrame]] = []
        for cam in self.cameras:
            cf = cam.grab_copied_frame(blocking=True)
            if cf is None:
                # Failed grab from at least one camera
                return None
            grabbed_frames.append(cf)

        # enqueue them and enforce queue_cap
        for i, cf in enumerate(grabbed_frames):
            q = self.queues[i]
            q.append(cf)
            if len(q) > self.queue_cap:
                # Camera i is lagging relative to others; drop oldest
                q.popleft()

        # attempt synchronization
        while self._queues_full():
            timestamps = [self.queues[i]
                          [0].timestamp_us for i in range(self.camera_count())]
            min_ts = min(timestamps)
            max_ts = max(timestamps)

            if (max_ts - min_ts) <= self.sync_threshold_us:
                # We have synced frames at the front of each queue
                synced = []
                for i in range(self.camera_count()):
                    synced.append(self.queues[i].popleft())
                return synced
            else:
                # Drop the earliest frame (smallest timestamp) and try again
                min_index = timestamps.index(min_ts)
                self.queues[min_index].popleft()

        # Not enough frames anymore to sync
        return None
