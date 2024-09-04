import logging
from ..broadcast_server import BroadcastServer, Message

class LogHandler(logging.Handler):
    def __init__(self, server: BroadcastServer, level: int | str = 0) -> None:
        super().__init__(level)
        self.server = server
        self.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - [%(name)s] - %(filename)s:%(lineno)d - %(funcName)s() - %(message)s'))

    def emit(self, record):
        self.server.broadcast(Message('log', {'log': self.format(record)}))
        print(self.format(record))
