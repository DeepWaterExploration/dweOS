from marshmallow import Schema, fields

class LightSchema(Schema):
    intensity = fields.Float()
    pin = fields.Int()
    nickname = fields.Str()
    controller_index = fields.Int()
    controller_name = fields.Str()