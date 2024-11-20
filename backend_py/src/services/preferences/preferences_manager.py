import json
from typing import Dict
from .preference_types import SavedPrefrences, StreamEndpoint
from .schemas import SavedPrefrencesSchema

class DefaultPreferences(SavedPrefrences):
    def __init__(self):
        super().__init__(StreamEndpoint('192.168.2.1', 5600), True)

class PreferencesManager:

    def __init__(self, settings_path: str = '.') -> None:
        path = f'{settings_path}/server_preferences.json'
        try:
            self.file_object = open(path, 'r+')
        except FileNotFoundError:
            open(path, 'w').close()
            self.file_object = open(path, 'r+')
        
        try:
            settings: list[Dict] = json.loads(self.file_object.read())
            self.settings: SavedPrefrences = SavedPrefrencesSchema().load(settings)
        except json.JSONDecodeError:
            self.settings = DefaultPreferences()

    def save(self, preferences: SavedPrefrences):
        self.settings = preferences
        self._save_settings()

    def get_preferences(self):
        return self.settings

    def serialize_preferences(self):
        return SavedPrefrencesSchema().dump(self.settings)

    def _save_settings(self):
        self.file_object.seek(0)
        self.file_object.write(
            json.dumps(SavedPrefrencesSchema().dump(self.settings)))
        self.file_object.truncate()
        self.file_object.flush()
