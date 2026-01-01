# run.py runs the backend, creating a async socketio server and a FastAPI web framework, then
# both are passed into a Server instance to handle logic, and a combination of the two is hosted 
# as a uvicorn server, which handles traffic

from src import Server, FeatureSupport
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from contextlib import asynccontextmanager
import logging

ORIGINS = ["*"]

# Use AsyncServer
sio = socketio.AsyncServer(
    cors_allowed_origins='*', async_mode="asgi", transports=["websocket"]
)


# Define events
@asynccontextmanager
async def lifespan(app: FastAPI):
    server.serve()
    yield
    print("Shutting down server...")


# FastAPI application
app = FastAPI(
    lifespan=lifespan, title="DWE OS API", description="API for DWE OS", version="0.1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # you can narrow this to your frontend URL
    allow_credentials=False,        # must be False if you keep ["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Server instance
# server = Server(FeatureSupport.none(), sio, app, settings_path='.')
server = Server(
    FeatureSupport.all(), sio, app, settings_path=".", log_level=logging.DEBUG
)

# Combine FastAPI and Socket.IO ASGI apps
app = socketio.ASGIApp(sio, other_asgi_app=app)

# Run with Uvicorn
if __name__ == "__main__":
    import uvicorn

    async def main():
        config = uvicorn.Config(app, host="0.0.0.0", port=5000, log_level="warning")
        server = uvicorn.Server(config)
        await server.serve()

    asyncio.run(main())
