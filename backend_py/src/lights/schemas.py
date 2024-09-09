from marshmallow import Schema, fields
from .light_types import LightType

class LightSchema(Schema):
    intensity = fields.Float()
    pin = fields.Int()
    nickname = fields.Str()
    type = fields.Enum(LightType, by_value=True)