"""
preference_manager.py

Manages persistence of server settings by reading from / writing to
server_preferences.json

Handles loading saved prefs and updating the json when settings are modified
"""

import json
import pathlib
import threading

from event_emitter import events

from src.models import SavedPreferencesModel


class PreferencesManager(events.EventEmitter):
    def __init__(self, settings_path: str = ".") -> None:
        super().__init__()

        self.path = pathlib.Path(settings_path, "server_preferences.json")
        self.settings = SavedPreferencesModel()
        self._load_settings()

        self._lock = threading.Lock()

    def save(self, preferences: SavedPreferencesModel) -> None:
        with self._lock:
            self.settings = preferences
        self._save_settings()

    def get_preferences(self) -> SavedPreferencesModel:
        return self.settings

    def serialize_preferences(self) -> SavedPreferencesModel:
        return self.settings

    def _load_settings(self) -> None:
        try:
            with self.path.open("r") as f:
                settings: dict = json.loads(f.read())
                self.settings: SavedPreferencesModel = (
                    SavedPreferencesModel.model_validate(settings)
                )
        except FileNotFoundError:
            self.settings = SavedPreferencesModel()

    def _save_settings(self) -> None:
        # I changed it to use the with statement and open the file every time we save,
        # but it might be more performant to keep the file open. This is solves the ruff
        # check that has issues with not using with
        with self._lock and self.path.open("w", encoding="utf-8") as f:
            f.write(self.settings.model_dump_json(indent=4))
