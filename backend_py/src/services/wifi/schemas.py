from marshmallow import Schema, fields, post_load
from .wifi_types import NetworkConfig

class ConnectionSchema(Schema):
    id = fields.Str(required=True)
    type = fields.Str(required=True)

class AccessPointSchema(Schema):
    ssid = fields.Str(required=True)
    strength = fields.Int(required=True)
    requires_password = fields.Bool(required=True)

class NetworkConfigSchema(Schema):
    ssid = fields.Str(required=True)
    password = fields.Str(required=False)

    @post_load
    def make_network_config(self, data, **kwargs):
        return NetworkConfig(**data)
