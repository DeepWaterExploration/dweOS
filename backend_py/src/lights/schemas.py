from marshmallow import Schema, fields
from .light_types import LightType

class LightSchema(Schema):
    intensity = fields.Float()
    pin = fields.Int()
    nickname = fields.Str()
    controller_index = fields.Int()