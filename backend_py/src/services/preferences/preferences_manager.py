import json
from typing import Dict
from .pydantic_schemas import SavedPreferencesModel

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
            self.settings: SavedPreferencesModel = SavedPreferencesModel.model_validate(settings)
        except json.JSONDecodeError:
            self.settings = SavedPreferencesModel()

    def save(self, preferences: SavedPreferencesModel):
        self.settings = preferences
        self._save_settings()

    def get_preferences(self):
        return self.settings

    def serialize_preferences(self):
        return self.settings

    def _save_settings(self):
        self.file_object.seek(0)
        self.file_object.write(self.settings.model_dump_json())
        self.file_object.truncate()
        self.file_object.flush()
