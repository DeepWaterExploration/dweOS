"""
preferences.py

API endpoints for server perferences
Handles getting and setting preferences
"""

from fastapi import APIRouter, Request

from backend_py.src.models import SavedPreferencesModel

from ..schemas import SimpleRequestStatusModel
from ..services.preferences import PreferencesManager

preferences_router = APIRouter(tags=["preferences"])


@preferences_router.get("")
def get_preferences(request: Request) -> SavedPreferencesModel:
    preferences_manager: PreferencesManager = request.app.state.preferences_manager

    return preferences_manager.serialize_preferences()


@preferences_router.post("/save_preferences")
def set_preferences(
    request: Request, preferences: SavedPreferencesModel
) -> SimpleRequestStatusModel:
    preferences_manager: PreferencesManager = request.app.state.preferences_manager

    preferences_manager.save(preferences)

    return SimpleRequestStatusModel(success=True)


@preferences_router.get("/get_recommended_host")
def get_recommended_host(request: Request) -> dict[str, str]:
    # FIXME
    return {"host": request.client.host if request.client else ""}
