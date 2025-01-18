from flask import Flask, jsonify
from flask_socketio import SocketIO, emit
from marshmallow import ValidationError
import logging
from .websocket_types import Message
from .schemas import MessageSchema
import json

class BroadcastServer:
    """
    A WebSocket server for broadcasting messages using Flask-SocketIO.
    """
    def __init__(self, socketio: SocketIO) -> None:
        """
        Initializes a BroadcastServer instance.

        Args:
            socketio (SocketIO): The Flask-SocketIO instance.
        """
        self.messages = []
        self.socketio = socketio

        # Setup event handlers
        self._setup_handlers()

    def _setup_handlers(self):
        """
        Sets up Flask-SocketIO event handlers for WebSocket events.
        """
        @self.socketio.on('connect')
        def handle_connect():
            logging.info("Client connected.")

        @self.socketio.on('disconnect')
        def handle_disconnect():
            logging.info("Client disconnected.")

        @self.socketio.on('message')
        def handle_message(data):
            try:
                message_data = MessageSchema().load(json.loads(data))
                if message_data.event_name == 'ping':
                    emit('message', Message('pong', message_data.data).to_dict())
                else:
                    logging.info(f"Received message: {message_data}")
            except ValidationError as e:
                logging.warning(f"ValidationError: {e}")

    def broadcast(self, message: Message):
        """
        Broadcasts a message to all connected clients.
        """
        self.messages.append(message)
        self.socketio.emit('message', message.to_dict())
