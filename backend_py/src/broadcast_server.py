from websockets.server import serve
from websockets import broadcast, ConnectionClosed
import logging
import threading
import asyncio
from dataclasses import dataclass
from typing import *
import json


@dataclass
class Message:
    event_name: str
    data: Dict

    def __repr__(self) -> str:
        return f'{self.event_name}: {json.dumps(self.data)}'


class BroadcastServer:

    def __init__(self, port: int = 9002) -> None:
        self.thread = threading.Thread(target=self._run)
        self.messages: List[Message] = []
        self.clients = []
        self.is_running = False
        self.port = port

    def run_in_background(self):
        self.thread.start()

    def kill(self):
        self.is_running = False
        self.thread.join()

    def broadcast(self, message: Message):
        self.messages.append(message)

    async def _handler(self, websocket):
        self.clients.append(websocket)
        try:
            await websocket.wait_closed()
        finally:
            self.clients.remove(websocket)

    async def _try_send(self, websocket, message: Message):
        try:
            await websocket.send(repr(message))
        except ConnectionClosed:
            pass

    async def _broadcast(self, message):
        for websocket in self.clients:
            asyncio.create_task(self._try_send(websocket, message))

    async def _broadcast_messages(self):
        while self.is_running:
            await asyncio.sleep(0.25)

            for message in self.messages:
                await self._broadcast(message)
                self.messages.remove(message)

    def _run(self):
        asyncio.run(self._serve())

    async def _serve(self):
        self.is_running = True
        async with serve(self._handler, '0.0.0.0', self.port):
            await self._broadcast_messages()
