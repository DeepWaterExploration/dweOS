import logging
from ..broadcast_server import BroadcastServer, Message

class LogHandler(logging.Handler):
    def __init__(self, server: BroadcastServer, level: int | str = 0) -> None:
        super().__init__(level)
        self.server = server
        self.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - [%(name)s] - %(filename)s:%(lineno)d - %(funcName)s() - %(message)s'))
        self.logs = []

    def emit(self, record):
        # ignore the websockets server messages, they just spam
        if record.name == 'websockets.server':
            return
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
        self.server.broadcast(Message('log', log))
