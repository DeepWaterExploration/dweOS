from marshmallow import Schema, fields

class ConnectionSchema(Schema):
    id = fields.Str(required=True)
    type = fields.Str(required=True)

class AccessPointSchema(Schema):
    ssid = fields.Str(required=True)
    strength = fields.Int(required=True)
    requires_password = fields.Bool(required=True)
