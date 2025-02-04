from pydantic import BaseModel, Field
from typing import Optional
from ..cameras.pydantic_schemas import StreamEndpointSchema

class SavedPreferencesSchema(BaseModel):
    default_stream: Optional[StreamEndpointSchema] = StreamEndpointSchema(host='192.168.2.1', port=5600)
    suggest_host: bool = True
