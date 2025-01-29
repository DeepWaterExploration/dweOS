from src import DeviceManager, Server, FeatureSupport
import socketio
from fastapi import FastAPI
from flask_cors import CORS
import threading
import time
import asyncio
import IPython
from contextlib import asynccontextmanager
import logging

logging.getLogger().setLevel(logging.INFO)


# Use AsyncServer
sio = socketio.AsyncServer(
    cors_allowed_origins=['http://localhost:5173'],
    async_mode='asgi',
    transports=['websocket']
)

# Define events
@asynccontextmanager
async def lifespan(app: FastAPI):
    server.serve()
    yield
    print('Shutting down server...')

# FastAPI application
app = FastAPI(lifespan=lifespan)

# Server instance
server = Server(FeatureSupport.all(), sio, app)

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
