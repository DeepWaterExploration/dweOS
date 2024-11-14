from marshmallow import Schema, fields, post_load
from .types import FeatureSupport

class FeatureSupportSchema(Schema):
    ttyd = fields.Bool()
    wifi = fields.Bool()

    @post_load
    def make_feature_support(self, data, **kwargs):
        return FeatureSupport(**data)
    