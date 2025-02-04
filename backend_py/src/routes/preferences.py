from fastapi import APIRouter, Depends, Request
from typing import Dict
from ..services import PreferencesManager, SavedPrefrences, SavedPreferencesSchema

preferences_router = APIRouter(tags=['preferences'])

@preferences_router.get('/preferences')
def get_preferences(request: Request) -> SavedPreferencesSchema:
    preferences_manager: PreferencesManager = request.app.state.preferences_manager
 
    return preferences_manager.serialize_preferences()

@preferences_router.post('/preferences/save_preferences')
def set_preferences(request: Request, preferences: SavedPreferencesSchema):
    preferences_manager: PreferencesManager = request.app.state.preferences_manager

    preferences_manager.save(preferences)

    return {}

@preferences_router.get('/preferences/get_recommended_host')
def get_recommended_host(request: Request) -> Dict[str, str]:
    return {'host': request.client.host}
