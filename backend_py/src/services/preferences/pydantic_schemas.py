"""
pydantic_schemas.py

Defines Pydantic models for persistent server settings
Includes schemas for saved preferences, like default stream endpoints
"""

from pydantic import BaseModel, Field
from typing import Optional
from ..cameras.pydantic_schemas import StreamEndpointModel

class SavedPreferencesModel(BaseModel):
    default_stream: Optional[StreamEndpointModel] = StreamEndpointModel(host='192.168.2.1', port=5600)
    suggest_host: bool = True
