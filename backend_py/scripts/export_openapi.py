import json

from backend_py.run import fastapi_app

with open("openapi.json", "w") as f:
    json.dump(fastapi_app.openapi(), f, indent=2)
