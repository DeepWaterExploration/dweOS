"""
preference_manager.py

Manages persistence of server settings by reading from / writing to
server_preferences.json

Handles loading saved prefs and updating the json when settings are modified
"""

import json
import pathlib

from event_emitter import events

from .pydantic_schemas import SavedPreferencesModel


class PreferencesManager(events.EventEmitter):
    def __init__(self, settings_path: str = ".") -> None:
        super().__init__()

        self.path = pathlib.Path(settings_path, "server_preferences.json")
        self.settings = SavedPreferencesModel()
        self._load_settings()

    def save(self, preferences: SavedPreferencesModel) -> None:
        self.settings = preferences
        self.emit("preferences_updated", preferences)
        self._save_settings()

    def get_preferences(self):
        return self.settings

    def serialize_preferences(self):
        return self.settings

    def _load_settings(self) -> None:
        with self.path.open("r") as f:
            settings: list[dict] = json.loads(f.read())
            self.settings: SavedPreferencesModel = SavedPreferencesModel.model_validate(
                settings
            )

    def _save_settings(self) -> None:
        # CHECK: is this thread safe?
        with self.path.open("w", encoding="utf-8") as f:
            f.write(self.settings.model_dump_json(indent=4))
