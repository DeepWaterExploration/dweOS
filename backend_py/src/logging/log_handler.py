import datetime
import logging

import socketio

from .log_schemas import LogSchema


class LogHandler(logging.Handler):
    def __init__(self, sio: socketio.AsyncServer, level: int | str = 0) -> None:
        super().__init__(level)
        self.sio = sio
        self.logs: list[LogSchema] = []
        self.to_emit: list[LogSchema] = []

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
