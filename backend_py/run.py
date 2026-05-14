# run.py runs the backend, creating a async socketio server and a FastAPI web
# framework, then
# both are passed into a Server instance to handle logic, and a combination of the
# two is hosted as a uvicorn server, which handles traffic

import asyncio
import contextlib
import logging
from contextlib import asynccontextmanager

import socketio
from backend_py.src import FeatureSupport, Server
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

ORIGINS = ["*"]

# Use AsyncServer
sio = socketio.AsyncServer(
    cors_allowed_origins="*", async_mode="asgi", transports=["websocket"]
)


# Define events
@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ANN201
    await server.serve()
    yield
    print("Shutting down server...")
    try:
        server.shutdown()
    except Exception as e:
        print(f"Error during shutdown: {e}")


# FastAPI application
app = FastAPI(
    lifespan=lifespan, title="DWE OS API", description="API for DWE OS", version="0.1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Server instance
# server = Server(FeatureSupport.none(), sio, app, settings_path='.')
server = Server(
    FeatureSupport(ttyd=True, wifi=True, serial=True),
    sio,
    app,
    data_dir=".",
    settings_path=".",
    log_level=logging.DEBUG,
    is_dev_mode=True,
)

# Combine FastAPI and Socket.IO ASGI apps
app = socketio.ASGIApp(sio, other_asgi_app=app)

# Run with Uvicorn
if __name__ == "__main__":
    import uvicorn

    async def main() -> None:
        config = uvicorn.Config(app, host="0.0.0.0", port=5000, log_level="warning")
        server = uvicorn.Server(config)
        await server.serve()

    with contextlib.suppress(KeyboardInterrupt):
        asyncio.run(main())
