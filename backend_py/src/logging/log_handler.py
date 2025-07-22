import logging
import socketio
from typing import List
from .log_schemas import LogSchema
import datetime


class LogHandler(logging.Handler):
    def __init__(self, sio: socketio.Server, level: int | str = 0) -> None:
        super().__init__(level)
        self.sio = sio
        self.logs: List[LogSchema] = []
        self.to_emit: List[LogSchema] = []
        self.file_path = self._create_path()

    def _create_path(self):
        datetime.datetime.now().strftime("%Y-%m-%d--%H-%M-%S.log")

    def pop_logs(self):
        logs = self.to_emit
        self.to_emit = []
        return logs

    def emit(self, record):
        log = {
            "timestamp": record.asctime,
            "level": record.levelname,
            "name": record.name,
            "filename": record.filename,
            "lineno": record.lineno,
            "function": record.funcName,
            "message": record.message,
        }
        validated_log = LogSchema.model_validate(log)
        self.logs.append(validated_log)
        self.to_emit.append(validated_log)
