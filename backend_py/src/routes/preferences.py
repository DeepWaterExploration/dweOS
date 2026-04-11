"""
preferences.py

API endpoints for server perferences
Handles getting and setting preferences
"""

from fastapi import APIRouter, Request

from ..services.preferences import PreferencesManager, SavedPreferencesModel

preferences_router = APIRouter(tags=["preferences"])


@preferences_router.get("")
def get_preferences(request: Request) -> SavedPreferencesModel:
    preferences_manager: PreferencesManager = request.app.state.preferences_manager

    return preferences_manager.serialize_preferences()


@preferences_router.post("/save_preferences")
def set_preferences(request: Request, preferences: SavedPreferencesModel):
    preferences_manager: PreferencesManager = request.app.state.preferences_manager

    preferences_manager.save(preferences)

    return {}


@preferences_router.get("/get_recommended_host")
def get_recommended_host(request: Request) -> dict[str, str]:
    return {"host": request.client.host if request.client else ""}
