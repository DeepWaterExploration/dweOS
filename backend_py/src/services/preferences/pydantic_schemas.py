from pydantic import BaseModel, Field
from typing import Optional
from ..cameras.pydantic_schemas import StreamEndpointModel

class SavedPreferencesModel(BaseModel):
    default_stream: Optional[StreamEndpointModel] = StreamEndpointModel(host='192.168.2.1', port=5600)
    suggest_host: bool = True
