"""
Streams the kernel ring buffer into an in-memory buffer.

Reads /dev/kmsg rather than /proc/kmsg: /proc/kmsg is destructive (a read
consumes the records, which would starve journald/rsyslog), while /dev/kmsg
gives every reader its own position and replays the existing buffer on open.
Both need root (or kernel.dmesg_restrict=0).
"""

import asyncio
import logging
import os
from collections import deque

from pydantic import BaseModel

KMSG_PATH = "/dev/kmsg"
MAX_ENTRIES = 5000

# Syslog priorities, lowest number is most severe
LEVEL_NAMES = [
    "EMERG",
    "ALERT",
    "CRIT",
    "ERR",
    "WARNING",
    "NOTICE",
    "INFO",
    "DEBUG",
]


class KernelLogEntry(BaseModel):
    sequence: int
    # Seconds since boot, as in dmesg's default output
    timestamp: float
    level: str
    facility: int
    message: str


def parse_kmsg_record(record: str) -> KernelLogEntry | None:
    """
    Parse "<prefix>;<message>" where prefix is
    "priority,sequence,timestamp_us,flags[,...]". The message ends at the first
    newline; what follows is key=value device info.
    """
    if not record:
        return None
    prefix, sep, message = record.partition(";")
    if not sep:
        return None
    fields = prefix.split(",")
    if len(fields) < 3:
        return None
    try:
        priority = int(fields[0])
        sequence = int(fields[1])
        timestamp_us = int(fields[2])
    except ValueError:
        return None
    return KernelLogEntry(
        sequence=sequence,
        timestamp=timestamp_us / 1_000_000,
        level=LEVEL_NAMES[priority & 7],
        facility=priority >> 3,
        message=message.split("\n", 1)[0],
    )


class KernelLogService:
    def __init__(self, sio, max_entries: int = MAX_ENTRIES) -> None:
        self.sio = sio
        self.logger = logging.getLogger("dwe_os_2.KernelLogService")
        self.entries: deque[KernelLogEntry] = deque(maxlen=max_entries)
        self.available = False
        self._fd: int | None = None
        self._loop: asyncio.AbstractEventLoop | None = None
        self._buffer = b""

    def start(self) -> None:
        try:
            self._fd = os.open(KMSG_PATH, os.O_RDONLY | os.O_NONBLOCK)
        except OSError as e:
            self.logger.warning(
                f"Kernel logs unavailable, could not open {KMSG_PATH}: {e}"
            )
            return
        self.available = True
        self._loop = asyncio.get_running_loop()
        self._loop.add_reader(self._fd, self._on_readable)
        self._on_readable()  # drain the existing ring buffer
        self.logger.info(f"Reading kernel logs from {KMSG_PATH}")

    def stop(self) -> None:
        if self._fd is None:
            return
        if self._loop is not None:
            self._loop.remove_reader(self._fd)
        os.close(self._fd)
        self._fd = None
        self.available = False

    def _on_readable(self) -> None:
        new_entries: list[KernelLogEntry] = []
        while self._fd is not None:
            try:
                # Each read returns exactly one record
                data = os.read(self._fd, 8192)
            except BlockingIOError:
                break
            except OSError as e:
                # EPIPE: we fell behind and records were overwritten; the next
                # read resumes at the oldest remaining record
                if e.errno == 32:
                    continue
                self.logger.error(f"Error reading {KMSG_PATH}: {e}")
                self.stop()
                break
            if not data:
                break
            entry = parse_kmsg_record(data.decode("utf-8", errors="replace"))
            if entry is not None:
                new_entries.append(entry)

        if not new_entries:
            return
        self.entries.extend(new_entries)
        if self._loop is not None:
            self._loop.create_task(
                self.sio.emit("kernel_log", [e.model_dump() for e in new_entries])
            )
