from marshmallow import Schema, fields, exceptions, post_load
import typing

from .camera_types import *
from .saved_types import *
from .device import DeviceType


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


class MenuItem(Schema):
    index = fields.Int()
    name = fields.Str()


class ControlFlagsSchema(Schema):
    default_value = fields.Number()
    max_value = fields.Number()
    min_value = fields.Number()
    step = fields.Number()
    control_type = fields.Enum(ControlTypeEnum)
    menu = fields.Nested(MenuItem, many=True)


class ControlSchema(Schema):
    flags = fields.Nested(ControlFlagsSchema)
    control_id = fields.Int()
    name = fields.Str()
    value = fields.Number()


class DeviceInfoSchema(Schema):
    device_name = fields.Str()
    bus_info = fields.Str()
    device_paths = fields.List(fields.Str())
    vid = fields.Int()
    pid = fields.Int()


class DeviceOptionsSchema(Schema):
    bitrate = fields.Int()
    gop = fields.Int()
    mode = fields.Enum(H264Mode, by_value=True)


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
    configured = fields.Bool()


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
    device_type = fields.Enum(DeviceType)
    is_leader = fields.Bool(required=False, allow_none=True)
    leader = fields.Str(required=False, allow_none=True)
    follower = fields.Str(required=False, allow_none=True)

    # @post_dump(pass_original=True)
    # def dump_options(self, data: typing.Dict, original: Any, **kwargs):
    #     return data


class SavedDeviceSchema(DeviceSchema):
    controls = fields.Nested(ControlSchema, exclude=['flags'], many=True)
    stream = fields.Nested(StreamSchema, exclude=['device_path', 'started'])
    device_type = fields.Enum(DeviceType)

    @post_load()
    def make_saved_device(self, data: typing.Dict, **kwargs):
        interval = Interval(**data['stream']['interval'])
        saved_stream = SavedStream(data['stream']['encode_type'], data['stream']['stream_type'], data['stream']
                                   ['endpoints'], data['stream']['width'], data['stream']['height'], interval, data['stream']['configured'])
        saved_controls = []
        for control in data['controls']:
            saved_controls.append(SavedControl(
                control['control_id'], control['name'], control['value']))
            
        leader = None
        is_leader = None
        if 'leader' in data:
            is_leader = data['is_leader']
            leader = data['leader']

        return SavedDevice(data['bus_info'], data['vid'], data['pid'], data['nickname'], controls=saved_controls, stream=saved_stream, device_type=data['device_type'], leader=leader, is_leader=is_leader)


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
            data['value'] = H264Mode(data['value'])
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


class UVCControlSchema(Schema):
    bus_info = fields.Str()
    control_id = fields.Int()
    value = fields.Int()

class DeviceLeaderSchema(Schema):
    follower = fields.Str()
    # not required in case of removing leader
    leader = fields.Str(required=False, allow_none=True)
