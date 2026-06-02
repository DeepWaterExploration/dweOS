#!/usr/bin/env python3
from __future__ import annotations

import struct
from collections.abc import Iterable
from pathlib import Path
from typing import BinaryIO

MAGIC_BYTES = b"DWE.ai"
MAGIC_LEN = 6

# DWVOHeader layout (packed, little-endian)
# struct DWVOVersion { uint8_t major, minor, nightly; }
# uint8_t nCameras;
# struct DWVOFormat { uint32_t width, height, pixelFormat; uint8_t fps; }
# uint32_t extLength;
HEADER_STRUCT = struct.Struct("<3B B I I I B I")  # 21 bytes


class DWVOHeader:
    __slots__ = (
        "version",
        "n_cameras",
        "width",
        "height",
        "pixel_format",
        "fps",
        "ext_length",
    )

    def __init__(
        self,
        version: tuple[int, int, int],
        n_cameras: int,
        width: int,
        height: int,
        pixel_format: int,
        fps: int,
        ext_length: int,
    ) -> None:
        self.version = version
        self.n_cameras = n_cameras
        self.width = width
        self.height = height
        self.pixel_format = pixel_format
        self.fps = fps
        self.ext_length = ext_length

    @classmethod
    def read(cls, f: BinaryIO) -> DWVOHeader:
        magic = f.read(MAGIC_LEN)
        if len(magic) != MAGIC_LEN or magic != MAGIC_BYTES:
            raise ValueError(f"Invalid DWVO magic: {magic!r}")

        data = f.read(HEADER_STRUCT.size)
        if len(data) != HEADER_STRUCT.size:
            raise ValueError("Truncated DWVO header")

        (
            vmaj,
            vmin,
            vnight,
            n_cameras,
            width,
            height,
            pixel_format,
            fps,
            ext_length,
        ) = HEADER_STRUCT.unpack(data)

        return cls(
            version=(vmaj, vmin, vnight),
            n_cameras=n_cameras,
            width=width,
            height=height,
            pixel_format=pixel_format,
            fps=fps,
            ext_length=ext_length,
        )

    def write(self, f: BinaryIO) -> None:
        f.write(MAGIC_BYTES)
        f.write(
            HEADER_STRUCT.pack(
                self.version[0],
                self.version[1],
                self.version[2],
                self.n_cameras,
                self.width,
                self.height,
                self.pixel_format,
                self.fps,
                self.ext_length,
            )
        )

    def is_compatible(self, other: DWVOHeader) -> bool:
        return (
            self.n_cameras == other.n_cameras
            and self.width == other.width
            and self.height == other.height
            and self.pixel_format == other.pixel_format
            and self.fps == other.fps
            and self.ext_length == other.ext_length
        )


class DWVOVideoFrame:
    def __init__(self, bus_id: str, data: bytes) -> None:
        self.bus_id = bus_id
        self.data = data
        self.length = len(data)


class DWVOTimestampBlock:
    def __init__(self, timestamp: int, video_frames: list[DWVOVideoFrame]) -> None:
        self.timestamp = timestamp  # uint32
        self.video_frames = video_frames


class DWVOReader:
    def __init__(self, path: Path) -> None:
        self.path = Path(path)
        self.file: BinaryIO | None = None
        self.header: DWVOHeader | None = None
        self.ext_data: bytes | None = None

    def __enter__(self) -> DWVOReader:
        f = self.path.open("rb")
        self.file = f
        self.header = DWVOHeader.read(f)

        if self.header.ext_length:
            ext = f.read(self.header.ext_length)
            if len(ext) != self.header.ext_length:
                raise ValueError("Truncated DWVO extension data")
            self.ext_data = ext

        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        if self.file:
            self.file.close()

    def read_body(self, chunk_size=1024 * 1024) -> Iterable[bytes]:
        assert self.file is not None
        while True:
            chunk = self.file.read(chunk_size)
            if not chunk:
                break
            yield chunk

    def _read_exact(self, n: int) -> bytes:
        assert self.file is not None
        data = self.file.read(n)
        if len(data) != n:
            raise EOFError("Unexpected EOF while reading DWVO")
        return data

    def _read_c_string(self) -> str:
        assert self.file is not None
        buf = bytearray()
        while True:
            b = self.file.read(1)
            if b == b"":
                raise EOFError("EOF before null-terminated string ended")
            if b == b"\x00":
                break
            buf.extend(b)
        return buf.decode("utf-8", errors="replace")

    def iter_blocks(self) -> Iterable[DWVOTimestampBlock]:
        """
        Iterate timestamp blocks until EOF.
        Each block:
          uint32 timestamp;
          for cam in [0, n_cameras):
              char busID[] (null-terminated);
              uint32 length;
              uint8 data[length];
        """
        assert self.file is not None
        assert self.header is not None

        n_cams = self.header.n_cameras

        while True:
            # Try to read timestamp (4 bytes). If EOF, we're done.
            ts_bytes = self.file.read(4)
            if ts_bytes == b"":
                break  # normal EOF
            if len(ts_bytes) != 4:
                raise EOFError("Truncated timestamp at end of DWVO file")

            (timestamp,) = struct.unpack("<I", ts_bytes)

            frames: list[DWVOVideoFrame] = []
            for _ in range(n_cams):
                bus_id = self._read_c_string()

                len_bytes = self._read_exact(4)
                (length,) = struct.unpack("<I", len_bytes)

                data = self._read_exact(length)
                frames.append(DWVOVideoFrame(bus_id, data))

            yield DWVOTimestampBlock(timestamp, frames)


class DWVOWriter:
    """
    - Takes a DWVOHeader directly
    - Writes magic + header, then blocks in the same layout
    """

    def __init__(self, path: Path, header: DWVOHeader) -> None:
        self.path = Path(path)
        self.header = header
        self.file: BinaryIO | None = None

    def __enter__(self) -> DWVOWriter:
        self.file = self.path.open("wb")
        self.header.write(self.file)
        # No ext data support for now (ext_length must be set accordingly)
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        if self.file:
            self.file.close()

    def _pack_data(self, data: bytes) -> None:
        assert self.file is not None
        self.file.write(data)

    def _pack_value(self, fmt: str, value) -> None:
        self._pack_data(struct.pack(fmt, value))

    def write_block(self, block: DWVOTimestampBlock) -> None:
        """
        Write a single timestamp block, mirroring your DWVOWriter::WriteFrames
        (except timestamp type: we accept a Python int and truncate to uint32).
        """
        assert self.file is not None

        # timestamp: uint32 little-endian, truncated
        self._pack_value("<I", block.timestamp & 0xFFFFFFFF)

        for frame in block.video_frames:
            # busID + '\0'
            bus_bytes = frame.bus_id.encode("utf-8")
            self._pack_data(bus_bytes + b"\x00")

            # length: uint32
            self._pack_value("<I", frame.length)

            # data
            self._pack_data(frame.data)
