from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from fastapi import FastAPI, Request, HTTPException

from backend_py.src import Server, FeatureSupport
import socketio
import os
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from contextlib import asynccontextmanager
import argparse

ORIGINS = ["http://0.0.0.0:8000"]

# Use AsyncServer
sio = socketio.AsyncServer(async_mode="asgi", transports=["websocket"])


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
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Combine FastAPI and Socket.IO ASGI apps
asgi_app = socketio.ASGIApp(sio, other_asgi_app=app)

blueos_extension = {
    "name": "dwe_os_2",
    "description": "Web-based driver and software interface for DWE.ai cameras",
    "icon": "mdi-camera-plus",
    "company": "DeepWater Exploration",
    "version": "1.0.0",
    "webpage": "https://dwe.ai/products/dwe-os",
    "api": "https://dwe.ai/products/dwe-os",
}

if __name__ == "__main__":
    import uvicorn

    parser = argparse.ArgumentParser(description="Run the server with parameters")
    parser.add_argument("--no-ttyd", action="store_true", help="Disable ttyd server")
    parser.add_argument("--no-wifi", action="store_true", help="Disable WiFi")
    parser.add_argument(
        "--port", type=int, default=80, help="Set the port of the server"
    )
    parser.add_argument(
        "--settings-path",
        type=str,
        default=".",
        help="The path for the settings file (for docker use)",
    )

    args = parser.parse_args()

    # Server instance
    server = Server(
        FeatureSupport(ttyd=not args.no_ttyd, wifi=not args.no_wifi),
        sio,
        app,
        settings_path=args.settings_path,
    )

    FRONTEND_DIR = os.path.abspath("./frontend/dist")

    # Register as a BlueOS extension
    @app.get("/register_service")
    async def register_service():
        return JSONResponse(content=blueos_extension)

    # Do API mounting before static mounting

    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="static")

    @app.exception_handler(404)
    async def not_found(request: Request, exc: HTTPException):
        """Serve index.html for any unknown paths (Frontend Routing Support)"""
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

    async def main():
        config = uvicorn.Config(asgi_app, host="0.0.0.0", port=args.port)
        server = uvicorn.Server(config)
        await server.serve()

    asyncio.run(main())
