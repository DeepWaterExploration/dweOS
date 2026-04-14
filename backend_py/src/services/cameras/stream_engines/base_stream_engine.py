import logging
from abc import ABC, abstractmethod
from collections.abc import Callable

from .stream import Stream


class BaseStreamEngine(ABC):
    """
    Abstract class for any streaming backend
    """

    def __init__(self, streams: list[Stream], error_callback: Callable[[str], None]) -> None:
        super().__init__()

        self.streams = streams
        self.emit_error = error_callback
        self.logger = logging.getLogger(f"dwe_os_2.cameras.{self.__class__.__name__}")

    @abstractmethod
    def start(self):
        pass

    @abstractmethod
    def stop(self):
        pass
