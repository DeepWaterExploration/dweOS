from flask import Flask, jsonify
import socketio
from marshmallow import ValidationError
import logging
from .websocket_types import Message
from .schemas import MessageSchema
import json

class BroadcastServer:
    """
    A WebSocket server for broadcasting messages using Flask-SocketIO.
    """
    def __init__(self, sio: socketio.Server) -> None:
        """
        Initializes a BroadcastServer instance.

        Args:
            socketio (SocketIO): The Flask-SocketIO instance.
        """
        self.messages = []
        self.sio = sio

        # Setup event handlers

    def broadcast(self, message: Message):
        """
        Broadcasts a message to all connected clients.
        """
        self.messages.append(message)
        self.sio.emit('message', message.to_dict())
