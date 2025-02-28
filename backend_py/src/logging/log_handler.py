import logging
import socketio
from typing import List
from .log_schemas import LogSchema


class LogHandler(logging.Handler):
    def __init__(self, sio: socketio.Server, level: int | str = 0) -> None:
        super().__init__(level)
        self.sio = sio
        self.setFormatter(
            logging.Formatter(
                "%(asctime)s - %(levelname)s - [%(name)s] - %(filename)s:%(lineno)d - %(funcName)s() - %(message)s"
            )
        )
        self.logs: List[LogSchema] = []
        self.to_emit: List[LogSchema] = []

    def pop_logs(self):
        logs = self.to_emit
        self.to_emit = []
        return logs

    def emit(self, record):
        fmt = self.format(record)
        print(fmt)
        log = {
            "timestamp": record.asctime,
            "level": record.levelname,
            "name": record.name,
            "filename": record.filename,
            "lineno": record.lineno,
            "function": record.funcName,
            "message": record.message,
        }
        self.logs.append(LogSchema.model_validate(log))
        self.to_emit.append(LogSchema.model_validate(log))
        # asyncio.create_task(self.sio.emit('log', log))
