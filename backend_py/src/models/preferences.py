"""
preferences.py

Defines Pydantic models for persistent server settings
Includes schemas for saved preferences, like default stream endpoints
"""

from enum import Enum

from pydantic import BaseModel

from .cameras import StreamEndpointModel


class StoragePolicyEnum(str, Enum):
    STOP = "STOP"
    DELETE_OLDEST = "DELETE_OLDEST"


class SavedPreferencesModel(BaseModel):
    default_stream: StreamEndpointModel | None = StreamEndpointModel(
        host="192.168.2.1", port=5600
    )
    suggest_host: bool = True
    frequency_offset: float = 0
    # What to do when free space in the recordings directory drops below the minimum
    storage_policy: StoragePolicyEnum = StoragePolicyEnum.STOP
    min_free_space_gb: float = 1
