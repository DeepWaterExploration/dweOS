from src import DeviceManager
import socketio
from fastapi import FastAPI
from flask_cors import CORS
import threading
import time
import asyncio
import IPython

# Use AsyncServer
sio = socketio.AsyncServer(
    cors_allowed_origins=['http://localhost:5173'],
    async_mode='asgi',
    transports=['websocket']
)

device_manager = DeviceManager(sio)
device_manager._is_monitoring = True


# FastAPI application
app = FastAPI()

# test sending message to client
async def send_message():
    await device_manager._monitor()

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(send_message())

# Define events
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    await sio.emit('welcome', {'message': 'Hello, client!'}, room=sid)

# Combine FastAPI and Socket.IO ASGI apps
app = socketio.ASGIApp(sio, other_asgi_app=app)

# Run with Uvicorn
if __name__ == "__main__":
    import uvicorn

    async def main():
        config = uvicorn.Config(app, host="0.0.0.0", port=5000)
        server = uvicorn.Server(config)
        await server.serve()

    asyncio.run(main())
