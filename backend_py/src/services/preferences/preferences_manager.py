"""
preference_manager.py

Manages persistence of server settings by reading from / writing to
server_preferences.json

Handles loading saved prefs and updating the json when settings are modified
"""

from event_emitter import events

from backend_py.src.models import SavedPreferencesModel

from .persistent_manager import PersistentManager


class PreferencesManager(PersistentManager[SavedPreferencesModel], events.EventEmitter):
    def __init__(self, settings_path: str = ".") -> None:
        PersistentManager.__init__(self, settings_path, "server_preferences.json")
        events.EventEmitter.__init__(self)

    def _default_settings(self) -> SavedPreferencesModel:
        return SavedPreferencesModel()

    def _parse_settings(self, raw: bytes) -> SavedPreferencesModel:
        return SavedPreferencesModel.model_validate_json(raw)

    def _serialize_settings(self) -> str:
        return self.settings.model_dump_json(indent=4)

    def save(self, preferences: SavedPreferencesModel) -> None:
        with self._lock:
            self.settings = preferences
        self.emit("preferences_updated", preferences)
        self._save_settings()

    def get_preferences(self) -> SavedPreferencesModel:
        return self.settings

    def serialize_preferences(self) -> SavedPreferencesModel:
        return self.settings
