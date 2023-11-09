from marshmallow import Schema, fields, post_load, post_dump
from enum import Enum
import typing
from device import *


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


class ControlTypeEnum(Enum):
    INTEGER = 1
    BOOLEAN = 2
    MENU = 3
    BUTTON = 4
    INTEGER64 = 5
    CTRL_CLASS = 6
    STRING = 7
    BITMASK = 8
    INTEGER_MENU = 9


class ControlFlagsSchema(Schema):
    default_value = fields.Number()
    disabled = fields.Bool()
    grabbed = fields.Bool()
    max_value = fields.Number()
    min_value = fields.Number()
    read_only = fields.Bool()
    slider = fields.Number()
    step = fields.Number()
    control_type = fields.Enum(ControlTypeEnum)
    update = fields.Number()
    volitility = fields.Number()
    write_only = fields.Bool()
    # menu = fields.List(list[str] | list[int] | list[float])


class ControlSchema(Schema):
    flags = fields.Nested(ControlFlagsSchema)
    control_id = fields.Number()
    name = fields.Str()
    value = fields.Number()


class DeviceInfoSchema(Schema):
    device_name = fields.Str()
    bus_info = fields.Str()
    device_paths: fields.List(fields.Str())
    vid = fields.Str()
    pid = fields.Str()


class DeviceOptionsSchema(Schema):
    bitrate = fields.Int()
    gop = fields.Int()
    mode = fields.Int()


class DeviceSchema(Schema):
    cameras = fields.Nested(CameraSchema, many=True)
    controls = fields.Nested(ControlSchema, many=True)
    name = fields.Str()
    pid = fields.Int()
    vid = fields.Int()
    usb_info = fields.Str()
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
        data['options'] = DeviceOptionsSchema().load(options)
        return data

    @post_load
    def make_device(self, data, **kwargs):
        return EHDDevice(self.device_info)
