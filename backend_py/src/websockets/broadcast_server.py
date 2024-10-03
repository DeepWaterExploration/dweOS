"""
WebSocket server implementation for broadcasting messages to connected clients.

This script defines a WebSocket server using the websockets library to facilitate
communication between clients and the server. The server broadcasts messages to all
connected clients and manages client connections.

Classes:
    BroadcastServer: Represents a WebSocket server instance.
    Message: Represents a message to be sent over WebSocket connections.
"""

import asyncio
import json
import logging
import threading
from dataclasses import dataclass
from typing import Dict, List

from websockets.server import serve
from websockets import broadcast, ConnectionClosed, WebSocketServerProtocol


@dataclass
class Message:
    """
    Represents a message containing an event name and associated data.

    Attributes:
        event_name (str): The name of the event associated with the message.
        data (Dict): A dictionary containing the data associated with the message.

    Methods:
        __repr__: Returns a string representation of the message in the format "<event_name>: <data_as_json>".
    """
    event_name: str
    data: Dict

    def __repr__(self) -> str:
        return f'{self.event_name}: {json.dumps(self.data)}'


class BroadcastServer:
    """
    A WebSocket server for broadcasting messages to connected clients asynchronously.

    Attributes:
        port (int): The port on which the server listens for incoming connections. Defaults to 9002.
        thread (Thread): A background thread for running the server's event loop asynchronously.
        messages (List[Message]): A list to store messages to be broadcasted to connected clients.
        clients (List): A list to store WebSocket connections of connected clients.
        is_running (bool): A flag indicating whether the server is running or not.
    """

    def __init__(self, port: int = 9002) -> None:
        """
        Initializes a BroadcastServer instance.

        Args:
            port (int, optional): The port on which the server will listen for incoming connections. Defaults to 9002.
        """
        self.thread = threading.Thread(target=self._run)
        self.messages: List[Message] = []
        self.clients = []
        self.is_running = False
        self.port = port


    def run_in_background(self):
        """
        Starts the server in a background thread.

        This method initiates the server's event loop in a separate background thread, allowing the server to handle
        incoming connections and broadcast messages asynchronously while the main program continues executing other tasks.
        """

        self.thread.start()


    def kill(self):
        """
        Stops the server and joins the background thread.

        This method stops the server by setting the is_running flag to False and joining the background thread, allowing
        the server to shut down.
        """

        self.is_running = False
        self.thread.join()


    def broadcast(self, message: Message):
        """
        Broadcasts a message to all connected clients.

        This method adds the specified message to the list of messages to be broadcasted to all connected clients.
        The message will be sent to all clients asynchronously during the next broadcast cycle.

        Args:
            message (Message): The message to be broadcasted to all connected clients.
        """
        self.messages.append(message)


    async def _handler(self, websocket: WebSocketServerProtocol):
        """
        Handles an incoming WebSocket connection.

        This coroutine function is responsible for handling an incoming WebSocket connection.
        It adds the WebSocket connection of the client to the list of connected clients and waits
        until the connection is closed before removing it from the list.

        Args:
            websocket (websockets.WebSocketServerProtocol): The WebSocket connection object representing the client.
        """
        self.clients.append(websocket)
        try:
            await websocket.wait_closed()
        finally:
            self.clients.remove(websocket)


    async def _try_send(self, websocket: WebSocketServerProtocol, message: Message):
        """
        Attempts to send a message to a WebSocket client.

        This coroutine function attempts to send the specified message to the WebSocket client represented by the
        provided WebSocket connection. If the connection is closed, it ignores the error and continues.

        Args:
            websocket (websockets.WebSocketServerProtocol): The WebSocket connection object representing the client.
            message (Message): The message to be sent to the WebSocket client.
        """
        try:
            await websocket.send(repr(message))
        except ConnectionClosed:
            pass


    async def _broadcast(self, message: Message):
        """
        Broadcasts a message to all connected clients asynchronously.

        This coroutine function broadcasts the specified message to all connected clients by iterating
        through the list of clients and attempting to send the message to each client's WebSocket connection.
        Each message is sent asynchronously, allowing the server to continue handling other tasks while
        broadcasting messages to clients.

        Args:
            message (Message): The message to be broadcasted to all connected clients.
        """
        for websocket in self.clients:
            asyncio.create_task(self._try_send(websocket, message))


    async def _broadcast_messages(self):
        """
        Broadcasts messages to all connected clients in a continuous loop asynchronously.

        This coroutine function continuously broadcasts messages to all connected clients by iterating
        through the list of messages to be broadcasted and sending each message to all clients. The method
        runs in a loop while the server is running, asynchronously sending messages at regular intervals.
        """
        while self.is_running:
            await asyncio.sleep(0.25)

            for message in self.messages:
                await self._broadcast(message)
                self.messages.remove(message)


    def _run(self):
        """
        Runs the WebSocket server event loop.

        This method is responsible for starting the asyncio event loop and running the WebSocket server.
        It sets the server's is_running flag to True before starting the event loop. The server runs until
        it is stopped externally by setting the is_running flag to False.
        """
        asyncio.run(self._serve())


    async def _serve(self):
        """
        Serves WebSocket connections and broadcasts messages.

        This coroutine function serves WebSocket connections by creating a WebSocket server
        and continuously broadcasting messages to connected clients. It runs in an asynchronous
        context manager and manages the lifecycle of the WebSocket server.
        """
        self.is_running = True
        async with serve(self._handler, '0.0.0.0', self.port):
            await self._broadcast_messages()
