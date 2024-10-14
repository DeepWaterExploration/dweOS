from marshmallow import Schema, fields, post_load
from .websocket_types import Message

class MessageSchema(Schema):
    event_name = fields.Str(required=True)
    data = fields.Dict(required=True)

    @post_load
    def make_message(self, data, **kwargs):
        return Message(data['event_name'], data['data'])
