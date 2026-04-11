"""
preference_manager.py

Manages persistence of server settings by reading from / writing to server_preferences.json
Handles loading saved prefs and updating the json when settings are modified
"""

import json

from event_emitter import events

from .pydantic_schemas import SavedPreferencesModel


class PreferencesManager(events.EventEmitter):
    def __init__(self, settings_path: str = ".") -> None:
        super().__init__()

        self.path = f"{settings_path}/server_preferences.json"

    def __enter__(self):
        try:
            self.file_object = open(self.path, "r+")
        except FileNotFoundError:
            open(self.path, "w").close()
            self.file_object = open(self.path, "r+")

        try:
            settings: list[dict] = json.loads(self.file_object.read())
            self.settings: SavedPreferencesModel = SavedPreferencesModel.model_validate(settings)
        except json.JSONDecodeError:
            self.settings = SavedPreferencesModel()

    def __exit__(self, exc_type, exc, tb):
        self.file_object.close()

    def save(self, preferences: SavedPreferencesModel):
        self.settings = preferences
        self.emit("preferences_updated", preferences)
        self._save_settings()

    def get_preferences(self):
        return self.settings

    def serialize_preferences(self):
        return self.settings

    # TODO: make thread safe
    def _save_settings(self):
        self.file_object.seek(0)
        self.file_object.write(self.settings.model_dump_json())
        self.file_object.truncate()
        self.file_object.flush()
