from marshmallow import Schema, fields, post_dump, exceptions, pre_load, post_load
import typing

from camera_types import *
from device import EHDDevice
from api import *


class UnionField(fields.Field):

    valid_types: typing.List[fields.Field]

    def __init__(self, *valid_types: typing.List[fields.Field]):
        self.valid_types = valid_types

    def _serialize(self, value, attr: str | None, data: typing.Mapping[str, typing.Any], **kwargs):
        errors = []
        for valid_type in self.valid_types:
            try:
                valid_type.serialize(value, attr)
            except exceptions.ValidationError as error:
                errors.append(error)
        if len(errors) > 0:
            raise exceptions.ValidationError(errors)

    def _deserialize(self, value, attr: str | None, data: typing.Mapping[str, typing.Any] | None, **kwargs):
        errors = []
        for valid_type in self.valid_types:
            try:
                valid_type.deserialize(value, attr)
            except exceptions.ValidationError as error:
                errors.append(error)
        if len(errors) > 0:
            raise exceptions.ValidationError(errors)


class CameraIntervalSchema(Schema):
    numerator = fields.Int()
    denominator = fields.Int()


class CameraFormatSizeSchema(Schema):
    width = fields.Int()
    height = fields.Int()
    intervals = fields.List(fields.Nested(CameraIntervalSchema))


class CameraSchema(Schema):
    path = fields.Str()
    formats = fields.Dict(fields.Str(),
                          fields.Nested(CameraFormatSizeSchema, many=True))


class ControlFlagsSchema(Schema):
    default_value = fields.Int()
    max_value = fields.Int()
    min_value = fields.Int()
    step = fields.Int()
    control_type = fields.Enum(ControlTypeEnum)
    menu = fields.List(UnionField(fields.Str(), fields.Int()))


class ControlSchema(Schema):
    flags = fields.Nested(ControlFlagsSchema)
    control_id = fields.Int()
    name = fields.Str()
    value = fields.Int()


class DeviceInfoSchema(Schema):
    device_name = fields.Str()
    bus_info = fields.Str()
    device_paths: fields.List(fields.Str())
    vid = fields.Int()
    pid = fields.Int()


class DeviceOptionsSchema(Schema):
    bitrate = fields.Int()
    gop = fields.Int()
    mode = fields.Enum(EHDDevice.H264Mode, by_value=True)


class StreamEndpointSchema(Schema):
    host = fields.Str()
    port = fields.Int()

    @post_load()
    def make_endpoint(self, data: typing.Dict, **kwargs):
        return StreamEndpoint(data['host'], data['port'])


class StreamSchema(Schema):
    device_path = fields.Str()
    encode_type = fields.Enum(StreamEncodeTypeEnum)
    stream_type = fields.Enum(StreamTypeEnum)
    endpoints = fields.Nested(StreamEndpointSchema, many=True)
    width = fields.Int()
    height = fields.Int()
    interval = fields.Nested(CameraIntervalSchema)
    started = fields.Bool()


class DeviceSchema(Schema):
    cameras = fields.Nested(CameraSchema, many=True)
    controls = fields.Nested(ControlSchema, many=True)
    stream = fields.Nested(StreamSchema)
    name = fields.Str()
    vid = fields.Int()
    pid = fields.Int()
    bus_info = fields.Str()
    manufacturer = fields.Str()
    nickname = fields.Str()
    device_info = fields.Nested(DeviceInfoSchema)
    options = fields.Nested(DeviceOptionsSchema)

    @post_dump(pass_original=True)
    def dump_options(self, data: typing.Dict, original: EHDDevice, **kwargs):
        options = {
            'bitrate': original.get_bitrate(),
            'gop': original.get_gop(),
            'mode': original.get_mode()
        }
        if (self.only and 'options' in self.only) and (self.exclude and 'options' not in self.exclude):
            data['options'] = DeviceOptionsSchema().dump(options)
        elif not self.only and not self.exclude:
            data['options'] = DeviceOptionsSchema().dump(options)
        return data


# API SCHEMAS

class OptionTypeEnum(Enum):
    BITRATE = 'bitrate'
    GOP = 'gop'
    MODE = 'mode'


class OptionValueSchema(Schema):
    bus_info = fields.Str()
    option = fields.Enum(OptionTypeEnum)
    value = fields.Int()

    @post_load()
    def dump_options(self, data: typing.Dict, **kwargs):
        if data['option'] is OptionTypeEnum.MODE:
            data['value'] = EHDDevice.H264Mode(data['value'])
        return data


class StreamInfoSchema(Schema):
    bus_info = fields.Str()
    stream_format = fields.Nested(
        StreamSchema, only=['width', 'height', 'interval'])
    encode_type = fields.Enum(StreamEncodeTypeEnum)
    endpoints = fields.Nested(StreamEndpointSchema, many=True)


class DeviceNicknameSchema(Schema):
    bus_info = fields.Str()
    nickname = fields.Str()
