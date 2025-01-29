import logging
import socketio
import asyncio

class LogHandler(logging.Handler):
    def __init__(self, sio: socketio.Server, level: int | str = 0) -> None:
        super().__init__(level)
        self.sio = sio
        self.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - [%(name)s] - %(filename)s:%(lineno)d - %(funcName)s() - %(message)s'))
        self.logs = []

    def emit(self, record):
        fmt = self.format(record)
        # print the logs
        print(fmt)
        log = {
            'timestamp': record.asctime, 
            'level': record.levelname, 
            'name': record.name, 
            'filename': record.filename, 
            'lineno': record.lineno,
            'function': record.funcName, 
            'message': record.message
        }
        self.logs.append(log)
        asyncio.create_task(self.sio.emit('log', log))
