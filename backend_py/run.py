from src import Server, FeatureSupport
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from contextlib import asynccontextmanager
import logging

logging.getLogger().setLevel(logging.INFO)

ORIGINS = ['http://localhost:5173']

# Use AsyncServer
sio = socketio.AsyncServer(
    cors_allowed_origins=ORIGINS,
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
app = FastAPI(lifespan=lifespan, title='DWE OS API', description='API for DWE OS', version='0.1.0')

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Server instance
server = Server(FeatureSupport.none(), sio, app, settings_path='.')

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
