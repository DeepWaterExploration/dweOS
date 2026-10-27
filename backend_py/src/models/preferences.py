"""
preferences.py

Defines Pydantic models for persistent server settings
Includes schemas for saved preferences, like default stream endpoints
"""

from pydantic import BaseModel, Field

from .cameras import StreamEndpointModel


class SavedPreferencesModel(BaseModel):
    default_stream: StreamEndpointModel | None = StreamEndpointModel(
        host="192.168.2.1", port=5600
    )
    suggest_host: bool = True
    frequency_offset: float = 0
    # Splits recordings into files of this many minutes each
    split_recording_enabled: bool = False
    split_recording_minutes: int = Field(default=5, ge=1)
