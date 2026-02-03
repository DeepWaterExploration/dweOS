from abc import ABC, abstractmethod
from typing import List, Callable
from .stream import Stream
import logging


class BaseStreamEngine(ABC):
    """
    Abstract class for any streaming backend
    """

    def __init__(self, streams: List[Stream], error_callback: Callable[[str], None]):
        super().__init__()

        self.streams = streams
        self.emit_error = error_callback
        self.logger = logging.getLogger(
            f"dwe_os_2.cameras.{self.__class__.__name__}")

    @abstractmethod
    def start(self):
        pass

    def stop(self):
        pass
