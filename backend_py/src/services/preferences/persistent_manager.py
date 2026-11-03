"""
persistent_manager.py

Base class for managers that keep their state in a JSON file
Handles loading with a fallback for missing or corrupted files, and saving in a way
that cannot leave a partially written file behind if power is lost
"""

import abc
import os
import pathlib
import threading
from typing import Generic, TypeVar

import pydantic

T = TypeVar("T")


class PersistentManager(abc.ABC, Generic[T]):
    def __init__(self, settings_path: str, filename: str) -> None:
        self.path = pathlib.Path(settings_path, filename)
        # Reentrant so that subclasses can save while already holding the lock
        self._lock = threading.RLock()
        self.settings: T = self._load_settings()

    @abc.abstractmethod
    def _default_settings(self) -> T:
        """The settings to use when the file is missing or corrupted"""

    @abc.abstractmethod
    def _parse_settings(self, raw: bytes) -> T:
        """Parse the file contents, raising pydantic.ValidationError if invalid"""

    @abc.abstractmethod
    def _serialize_settings(self) -> str:
        """The current settings as the text to store in the file"""

    def _load_settings(self) -> T:
        try:
            return self._parse_settings(self.path.read_bytes())
        except (FileNotFoundError, pydantic.ValidationError):
            return self._default_settings()

    def _save_settings(self) -> None:
        with self._lock:
            data = self._serialize_settings()
            tmp_path = self.path.with_name(f"{self.path.name}.tmp")
            try:
                with tmp_path.open("w", encoding="utf-8") as f:
                    f.write(data)
                    f.flush()
                    # The data must reach the disk before the rename, otherwise a
                    # power loss could still leave an empty file in place
                    os.fsync(f.fileno())
                os.replace(tmp_path, self.path)
            except OSError:
                tmp_path.unlink(missing_ok=True)
                raise
