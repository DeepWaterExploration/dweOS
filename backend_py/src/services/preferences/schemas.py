from marshmallow import Schema, fields, post_load
from .preference_types import SavedPrefrences
from ..cameras.schemas import StreamEndpointSchema

class SavedPrefrencesSchema(Schema):
    default_stream = fields.Nested(StreamEndpointSchema)
    suggest_host = fields.Bool()

    @post_load
    def make_saved_preferences(self, data, **kwargs):
        return SavedPrefrences(**data)
    