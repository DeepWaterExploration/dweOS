 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/backend_py/src/logging/log_handler.py b/backend_py/src/logging/log_handler.py
index b98456b90bd6e188422cbf1e5f1b724843b0bae2..255783d0eb8164dc97febdfffc343510e44703fc 100644
--- a/backend_py/src/logging/log_handler.py
+++ b/backend_py/src/logging/log_handler.py
@@ -1,28 +1,29 @@
 import logging
+from typing import Union
 from ..websockets.broadcast_server import BroadcastServer, Message
 
 class LogHandler(logging.Handler):
-    def __init__(self, server: BroadcastServer, level: int | str = 0) -> None:
+    def __init__(self, server: BroadcastServer, level: Union[int, str] = 0) -> None:
         super().__init__(level)
         self.server = server
         self.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - [%(name)s] - %(filename)s:%(lineno)d - %(funcName)s() - %(message)s'))
         self.logs = []
 
     def emit(self, record):
         # ignore the websockets server messages, they just spam
         if record.name == 'websockets.server':
             return
         fmt = self.format(record)
         # print the logs
         print(fmt)
         log = {
             'timestamp': record.asctime, 
             'level': record.levelname, 
             'name': record.name, 
             'filename': record.filename, 
             'lineno': record.lineno,
             'function': record.funcName, 
             'message': record.message
         }
         self.logs.append(log)
         self.server.broadcast(Message('log', log))
diff --git a/backend_py/src/services/cameras/device.py b/backend_py/src/services/cameras/device.py
index 5c6c38cc6678c4e4202acaece95c23b202c70e7b..e04ecfd25eed3ccee6bc48cc99475117933f4746 100644
--- a/backend_py/src/services/cameras/device.py
+++ b/backend_py/src/services/cameras/device.py
@@ -1,67 +1,67 @@
 from ctypes import *
 import struct
 from dataclasses import dataclass
-from typing import Dict, Callable, Any
+from typing import Any, Callable, Dict, List, Optional, Tuple, Union
 
 import event_emitter as events
 
 from linuxpy.video import device
 from enum import Enum
 
 from . import v4l2
 from . import ehd_controls as xu
 
 from .stream_utils import fourcc2s
 from .enumeration import *
 from .camera_helper.camera_helper_loader import *
 from .camera_types import *
 from .stream import *
 from .saved_types import *
 from .stream_utils import string_to_stream_encode_type
 
 import logging
 
 PID_VIDS = {
     'exploreHD': {
         'VID': 0xc45,
         'PID': 0x6366,
         'device_type': DeviceType.EXPLOREHD
     },
     'stellarHD: Leader': {
         'VID': 0xc45,
         'PID': 0x6367,
         'device_type': DeviceType.STELLARHD_LEADER
     },
     'stellarHD: Follower': {
         'VID': 0xc45,
         'PID': 0x6368,
         'device_type': DeviceType.STELLARHD_FOLLOWER
     }
 }
 
-def lookup_pid_vid(vid: int, pid: int) -> Tuple[str, DeviceType]:
+def lookup_pid_vid(vid: int, pid: int) -> Optional[Tuple[str, DeviceType]]:
     for name in PID_VIDS:
         dev = PID_VIDS[name]
         if dev['VID'] == vid and dev['PID'] == pid:
             return (name, dev['device_type'])
     return None
 
 class Camera:
     '''
     Camera base class
     '''
 
     def __init__(self, path: str) -> None:
         self.path = path
         self._file_object = open(path)
         self._fd = self._file_object.fileno()  # get the file descriptor
         self._get_formats()
 
     # uvc_set_ctrl function defined in uvc_functions.c
     def uvc_set_ctrl(self, unit: xu.Unit, ctrl: xu.Selector, data: bytes, size: int) -> int:
         return camera_helper.uvc_set_ctrl(self._fd, unit, ctrl, data, size)
 
     # uvc_get_ctrl function defined in uvc_functions.c
     def uvc_get_ctrl(self, unit: xu.Unit, ctrl: xu.Selector, data: bytes, size: int) -> int:
         return camera_helper.uvc_get_ctrl(self._fd, unit, ctrl, data, size)
 
@@ -94,52 +94,52 @@ class Camera:
                     for k in range(1000):
                         frmival = v4l2.v4l2_frmivalenum()
                         frmival.index = k
                         frmival.pixel_format = v4l2_fmt.pixelformat
                         frmival.width = frmsize.discrete.width
                         frmival.height = frmsize.discrete.height
                         try:
                             fcntl.ioctl(
                                 self._fd, v4l2.VIDIOC_ENUM_FRAMEINTERVALS, frmival)
                         except:
                             break
                         if frmival.type == v4l2.V4L2_FRMIVAL_TYPE_DISCRETE:
                             format_size.intervals.append(
                                 Interval(frmival.discrete.numerator, frmival.discrete.denominator))
                     format_sizes.append(format_size)
             self.formats[fourcc2s(v4l2_fmt.pixelformat)] = format_sizes
 
 
 class Option:
     '''
     EHD Option Class
     '''
 
     def __init__(self, camera: Camera, fmt: str, unit: xu.Unit, ctrl: xu.Selector, command: xu.Command,
                  name: str,
-                 conversion_func_set: Callable[[Any],list|Any] = lambda val : val,
-                 conversion_func_get: Callable[[list|Any],Any] = lambda val : val,
+                 conversion_func_set: Callable[[Any], Union[List, Any]] = lambda val: val,
+                 conversion_func_get: Callable[[Union[List, Any]], Any] = lambda val: val,
                  size=11) -> None:
         self._camera = camera
         self._fmt = fmt
         self._conversion_func_set = conversion_func_set
         self._conversion_func_get = conversion_func_get
 
         self._unit = unit
         self._ctrl = ctrl
         self._command = command
         self._size = size
         self._data = b'\x00' * size
 
         self.name = name;
 
     # get the control value(s)
     def get_value_raw(self):
         self._get_ctrl()
         values = self._unpack(self._fmt)
         self._clear()
         # all cases will basically be this, but otherwise this will still work
         if len(values) == 1:
             return values[0]
         return values
 
     # set the control value
@@ -254,76 +254,72 @@ class Device(events.EventEmitter):
         return {}
 
     def _get_controls(self):
         fd = self.cameras[0]._fd
         self.controls: List[Control] = []
 
         for ctrl in self.v4l2_device.controls.values():
             control = Control(ctrl.id, ctrl.name, ctrl.value)
 
             control.flags.control_type = ControlTypeEnum(ctrl.type)
             try:
                 control.flags.max_value = ctrl.maximum
             except:
                 control.flags.max_value = 0
             try:
                 control.flags.min_value = ctrl.minimum
             except:
                 control.flags.min_value = 0
             try:
                 control.flags.step = ctrl.step
             except:
                 control.flags.step = 0
             control.flags.default_value = ctrl._info.default_value
             control.value = self.get_pu(ctrl.id)
 
-            match control.flags.control_type:
-                case ControlTypeEnum.MENU:
-                    for i in ctrl.data:
-                        menu_item = ctrl.data[i]
-                        control.flags.menu.append(
-                            MenuItem(i, menu_item))
+            if control.flags.control_type == ControlTypeEnum.MENU:
+                for i in ctrl.data:
+                    menu_item = ctrl.data[i]
+                    control.flags.menu.append(
+                        MenuItem(i, menu_item))
 
             self.controls.append(control)
 
-    def find_camera_with_format(self, fmt: str) -> Camera | None:
+    def find_camera_with_format(self, fmt: str) -> Optional[Camera]:
         for cam in self.cameras:
             if cam.has_format(fmt):
                 return cam
         return None
 
     def configure_stream(self, encode_type: StreamEncodeTypeEnum, width: int, height: int, interval: Interval, stream_type: StreamTypeEnum, stream_endpoints: List[StreamEndpoint] = []):
         logging.info(self._fmt_log('Configuring stream'))
 
         camera: Camera = None
-        match encode_type:
-            case StreamEncodeTypeEnum.H264:
-                camera = self.find_camera_with_format('H264')
-            case StreamEncodeTypeEnum.MJPG:
-                camera = self.find_camera_with_format('MJPG')
-            case _:
-                pass
+        if encode_type == StreamEncodeTypeEnum.H264:
+            camera = self.find_camera_with_format('H264')
+        elif encode_type == StreamEncodeTypeEnum.MJPG:
+            camera = self.find_camera_with_format('MJPG')
 
         if not camera:
             logging.warn('Attempting to select incompatible encoding type. This is undefined behavior.')
             return
 
 
         self.stream.device_path = camera.path
         self.stream.width = width
         self.stream.height = height
         self.stream.interval = interval
         self.stream.endpoints = stream_endpoints
         self.stream.encode_type = encode_type
         self.stream.stream_type = stream_type
         self.stream.configured = True
 
     def add_control_from_option(self, option_name: str, default_value: Any, control_type: ControlTypeEnum, max_value: float = 0, min_value: float = 0, step: float = 0):
         try:
             option = self._options[option_name]
             value = int(option.get_value())
             self.controls.insert(0, Control(
                 -self._id_counter, option.name, value, ControlFlags(
                     default_value, max_value, min_value, step, control_type
                 )
             ))
             self._id_counter += 1
diff --git a/backend_py/src/services/cameras/device_manager.py b/backend_py/src/services/cameras/device_manager.py
index fae0d775016ffec633edd94da0aa27addc8b9656..36def5727f1764720ba2613018021b7880a96376 100644
--- a/backend_py/src/services/cameras/device_manager.py
+++ b/backend_py/src/services/cameras/device_manager.py
@@ -1,114 +1,116 @@
-from typing import *
+from typing import Any, Dict, List, Optional, Union, cast
 import logging
 import time
 import threading
 import re
 import event_emitter as events
 
 from .schemas import *
 from .device import Device, lookup_pid_vid, DeviceInfo, DeviceType
 from .settings import SettingsManager
 from ...websockets.broadcast_server import BroadcastServer, Message
 from .enumeration import list_devices
 from .device_utils import list_diff, find_device_with_bus_info
 from .exceptions import DeviceNotFoundException
 
 from .ehd import EHDDevice
 from .shd import SHDDevice
 
 class DeviceManager(events.EventEmitter):
     '''
     Class for interfacing with and monitoring devices
     '''
 
     def __init__(self, broadcast_server=BroadcastServer(), settings_manager=SettingsManager()) -> None:
         self.devices: List[Device] = []
         self.broadcast_server = broadcast_server
         self.settings_manager = settings_manager
 
         self._thread = threading.Thread(target=self._monitor)
         self._is_monitoring = False
 
     def start_monitoring(self):
         '''
         Begin monitoring for devices in the background
         '''
         self._is_monitoring = True
         self._thread.start()
 
     def stop_monitoring(self):
         '''
         Kill the background monitor thread and stop all streams
         '''
         self._is_monitoring = False
         self._thread.join()
 
         for device in self.devices:
             device.stream.stop()
 
-    def create_device(self, device_info: DeviceInfo) -> Device | None:
+    def create_device(self, device_info: DeviceInfo) -> Optional[Device]:
         '''
         Create a new device based on enumerated device info
         '''
-        (_, device_type) = lookup_pid_vid(device_info.vid, device_info.pid)
+        lookup_result = lookup_pid_vid(device_info.vid, device_info.pid)
+        if not lookup_result:
+            return None
+        (_, device_type) = lookup_result
 
         device = None
-        match device_type:
-            case DeviceType.EXPLOREHD:
-                device = EHDDevice(device_info)
-            case DeviceType.STELLARHD_LEADER:
-                device = SHDDevice(device_info)
-            case DeviceType.STELLARHD_FOLLOWER:
-                device = SHDDevice(device_info, False)
-            case _:
-                # Not a DWE device
-                return None
+        if device_type == DeviceType.EXPLOREHD:
+            device = EHDDevice(device_info)
+        elif device_type == DeviceType.STELLARHD_LEADER:
+            device = SHDDevice(device_info)
+        elif device_type == DeviceType.STELLARHD_FOLLOWER:
+            device = SHDDevice(device_info, False)
+        else:
+            # Not a DWE device
+            return None
 
         # we need to broadcast that there was a gst error so that the frontend knows there may be a kernel issue
         device.stream_runner.on('gst_error', lambda errors: self._emit_gst_error(device, errors))
 
         return device
 
     def get_devices(self):
         '''
         Compile and sort a list of devices for jsonifcation
         '''
         device_list = DeviceSchema().dump(self.devices, many=True)
         key_pattern = re.compile(r'^(\D+)(\d+)$')
 
         def key(item: Dict):
             # Get the integer at the end of the path
             try:
                 m = key_pattern.match(item['cameras'][0]['path'])
                 return int(m.group(2))
             except:
                 return -1
         device_list.sort(key=key)
         return device_list
 
-    def set_device_option(self, bus_info: str, option: str, option_value: int | bool) -> bool:
+    def set_device_option(self, bus_info: str, option: str, option_value: Union[int, bool]) -> bool:
         '''
         Set a device option
         '''
         device = self._find_device_with_bus_info(bus_info)
 
         device.set_option(option, option_value)
 
         self.settings_manager.save_device(device)
         return True
 
     def configure_device_stream(self, bus_info: str, stream_info: StreamInfoSchema) -> bool:
         '''
         Configure a device's stream with the given stream info
         '''
         device = self._find_device_with_bus_info(bus_info)
 
         stream_format = stream_info['stream_format']
         width: int = stream_format['width']
         height: int = stream_format['height']
         interval: Interval = Interval(
             stream_format['interval']['numerator'], stream_format['interval']['denominator'])
         encode_type: StreamEncodeTypeEnum = stream_info['encode_type']
         endpoints = stream_info['endpoints']
 
         device.configure_stream(encode_type, width, height,
@@ -163,51 +165,51 @@ class DeviceManager(events.EventEmitter):
         '''
         follower_device = self._find_device_with_bus_info(follower_bus_info)
         leader_device = self._find_device_with_bus_info(leader_bus_info)
 
         if follower_device.device_type == DeviceType.STELLARHD_FOLLOWER:
             cast(SHDDevice, follower_device).set_leader(leader_device)
             self.settings_manager.save_device(follower_device)
         else:
             logging.warn('Attempting to add leader to a non follower device type.')
             return False
         return True
     
     def remove_leader(self, bus_info: str) -> bool:
         '''
         Remove leader from follower
         '''
         follower_device = self._find_device_with_bus_info(bus_info)
         if follower_device.device_type == DeviceType.STELLARHD_FOLLOWER:
             cast(SHDDevice, follower_device).remove_leader()
             self.settings_manager.save_device(follower_device)
         else:
             logging.warning('Attempting to remove leader from a non follower device type.')
             return False
         return True
 
-    def _find_device_with_bus_info(self, bus_info: str) -> Device | None:
+    def _find_device_with_bus_info(self, bus_info: str) -> Optional[Device]:
         '''
         Utility to find a device with bus info
         '''
         device = find_device_with_bus_info(self.devices, bus_info)
         if not device:
             raise DeviceNotFoundException(bus_info)
         return device
     
     def _get_devices(self, old_devices: List[DeviceInfo]):
         devices_info = list_devices()
         # enumerate the devices
         devices_info = list_devices()
 
         # find the new devices
         new_devices = list_diff(devices_info, old_devices)
 
         # find the removed devices
         removed_devices = list_diff(old_devices, devices_info)
 
         # add the new devices
         for device_info in new_devices:
             device = None
             try:
                 device = self.create_device(device_info)
                 if not device:
diff --git a/backend_py/src/services/cameras/device_utils.py b/backend_py/src/services/cameras/device_utils.py
index c634639b27939a84f9eea23821ed2df0836f98d4..bcc177c91d728f7aa4a926f4caf833788c6352ed 100644
--- a/backend_py/src/services/cameras/device_utils.py
+++ b/backend_py/src/services/cameras/device_utils.py
@@ -1,16 +1,16 @@
-from typing import List
+from typing import List, Optional
 from .device import Device
 
-def find_device_with_bus_info(devices: List[Device], bus_info: str) -> Device | None:
+def find_device_with_bus_info(devices: List[Device], bus_info: str) -> Optional[Device]:
     for device in devices:
         if device.bus_info == bus_info:
             return device
     return None
 
 def list_diff(listA, listB):
     # find the difference between lists
     diff = []
     for element in listA:
         if element not in listB:
             diff.append(element)
     return diff
diff --git a/backend_py/src/services/cameras/schemas.py b/backend_py/src/services/cameras/schemas.py
index b9c54c67c940da6d5ba224a14d5029d1086afeff..d0a0e0f050b09b92b7361639a0d625a13f01ad8c 100644
--- a/backend_py/src/services/cameras/schemas.py
+++ b/backend_py/src/services/cameras/schemas.py
@@ -1,51 +1,51 @@
 from marshmallow import Schema, fields, exceptions, post_load
 import typing
 
 from .camera_types import *
 from .saved_types import *
 from .device import DeviceType
 
 
 class UnionField(fields.Field):
 
     valid_types: typing.List[fields.Field]
 
     def __init__(self, *valid_types: typing.List[fields.Field]):
         self.valid_types = valid_types
 
-    def _serialize(self, value, attr: str | None, data: typing.Mapping[str, typing.Any], **kwargs):
+    def _serialize(self, value, attr: typing.Optional[str], data: typing.Mapping[str, typing.Any], **kwargs):
         errors = []
         for valid_type in self.valid_types:
             try:
                 valid_type.serialize(value, attr)
             except exceptions.ValidationError as error:
                 errors.append(error)
         if len(errors) > 0:
             raise exceptions.ValidationError(errors)
 
-    def _deserialize(self, value, attr: str | None, data: typing.Mapping[str, typing.Any] | None, **kwargs):
+    def _deserialize(self, value, attr: typing.Optional[str], data: typing.Optional[typing.Mapping[str, typing.Any]], **kwargs):
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
diff --git a/backend_py/src/services/cameras/stream.py b/backend_py/src/services/cameras/stream.py
index e91322543ad781d5ccb211fb050166c98da2639f..4b09196972384ff6326238af96408182f65f4804 100644
--- a/backend_py/src/services/cameras/stream.py
+++ b/backend_py/src/services/cameras/stream.py
@@ -4,87 +4,81 @@ import subprocess
 from multiprocessing import Process
 import time
 import shlex
 import threading
 import event_emitter as events
 
 from .camera_types import *
 
 import logging
 
 @dataclass
 class Stream(events.EventEmitter):
     device_path: str = ''
     encode_type: StreamEncodeTypeEnum = None
     stream_type: StreamTypeEnum = StreamTypeEnum.UDP
     endpoints: List[StreamEndpoint] = field(default_factory=list)
     width: int = None
     height: int = None
     interval: Interval = field(default_factory=Interval)
     configured: bool = False
 
     def _construct_pipeline(self):
         return f'{self._build_source()} ! {self._construct_caps()} ! {self._build_payload()} ! {self._build_sink()}'
 
     def _get_format(self):
-        match self.encode_type:
-            case StreamEncodeTypeEnum.H264:
-                return 'video/x-h264'
-            case StreamEncodeTypeEnum.MJPG:
-                return 'image/jpeg'
-            case _:
-                return ''
+        if self.encode_type == StreamEncodeTypeEnum.H264:
+            return 'video/x-h264'
+        if self.encode_type == StreamEncodeTypeEnum.MJPG:
+            return 'image/jpeg'
+        return ''
 
     def _build_source(self):
         return f'v4l2src device={self.device_path}'
 
     def _construct_caps(self):
         return f'{self._get_format()},width={self.width},height={self.height},framerate={self.interval.denominator}/{self.interval.numerator}'
 
     def _build_payload(self):
-        match self.encode_type:
-            case StreamEncodeTypeEnum.H264:
-                return 'h264parse ! queue ! rtph264pay config-interval=10 pt=96'
-            case StreamEncodeTypeEnum.MJPG:
-                return 'rtpjpegpay'
-            case _:
-                return ''
+        if self.encode_type == StreamEncodeTypeEnum.H264:
+            return 'h264parse ! queue ! rtph264pay config-interval=10 pt=96'
+        if self.encode_type == StreamEncodeTypeEnum.MJPG:
+            return 'rtpjpegpay'
+        return ''
 
     def _build_sink(self):
-        match self.stream_type:
-            case StreamTypeEnum.UDP:
-                if len(self.endpoints) == 0:
-                    return 'fakesink'
-                sink = 'multiudpsink sync=true clients='
-                for endpoint, i in zip(self.endpoints, range(len(self.endpoints))):
-                    sink += f'{endpoint.host}:{endpoint.port}'
-                    if i < len(self.endpoints)-1:
-                        sink += ','
-
-                return sink
-            case _:
-                return ''
+        if self.stream_type == StreamTypeEnum.UDP:
+            if len(self.endpoints) == 0:
+                return 'fakesink'
+            sink = 'multiudpsink sync=true clients='
+            for endpoint, i in zip(self.endpoints, range(len(self.endpoints))):
+                sink += f'{endpoint.host}:{endpoint.port}'
+                if i < len(self.endpoints)-1:
+                    sink += ','
+
+            return sink
+        return ''
 
     def start(*args):
         pass
 
     def stop(*args):
         pass
 
 class StreamRunner(events.EventEmitter):
 
     def __init__(self, *streams: Stream) -> None:
         super().__init__()
         self.streams = [*streams]
         self.pipeline = None
         self.loop = None
         self.started = False
         self.error_thread = None
 
     def start(self):
         if self.started:
             logging.info('Joining thread')
             self.stop()
             self.error_thread.join()
         self.started = True
         self._run_pipeline()
 
diff --git a/backend_py/src/services/cameras/stream_utils.py b/backend_py/src/services/cameras/stream_utils.py
index 507c1a1ea40e7f4e075cb7e4989fca18bb3e0178..2bedb2553e8251d673213f6b63fd52af18caf411 100644
--- a/backend_py/src/services/cameras/stream_utils.py
+++ b/backend_py/src/services/cameras/stream_utils.py
@@ -1,27 +1,25 @@
 from .camera_types import StreamEncodeTypeEnum
 
 def fourcc2s(fourcc: int):
     res = ''
     res += chr(fourcc & 0x7f)
     res += chr((fourcc >> 8) & 0x7f)
     res += chr((fourcc >> 16) & 0x7f)
     res += chr((fourcc >> 24) & 0x7f)
     if fourcc & (1 << 31):
         res += '-BE'
     return res
 
 def stream_encode_type_to_string(encode_type: StreamEncodeTypeEnum):
-    match encode_type:
-        case StreamEncodeTypeEnum.MJPG:
-            return 'MJPG'
-        case StreamEncodeTypeEnum.H264:
-            return 'H264'
+    if encode_type == StreamEncodeTypeEnum.MJPG:
+        return 'MJPG'
+    if encode_type == StreamEncodeTypeEnum.H264:
+        return 'H264'
     return None
 
 def string_to_stream_encode_type(encoding: str):
-    match encoding:
-        case 'MJPG':
-            return StreamEncodeTypeEnum.MJPG
-        case 'H264':
-            return StreamEncodeTypeEnum.H264
-    return None
\ No newline at end of file
+    if encoding == 'MJPG':
+        return StreamEncodeTypeEnum.MJPG
+    if encoding == 'H264':
+        return StreamEncodeTypeEnum.H264
+    return None
diff --git a/backend_py/src/services/ttyd/ttyd.py b/backend_py/src/services/ttyd/ttyd.py
index f886ab6e203a28b1f6ade084652b1e3295cc1514..b71b0eeaa29809a48466dadfe9a8e610ff2e064c 100644
--- a/backend_py/src/services/ttyd/ttyd.py
+++ b/backend_py/src/services/ttyd/ttyd.py
@@ -1,18 +1,19 @@
 import subprocess
+from typing import Optional
 
 class TTYDManager:
 
     TTYD_CMD = ['ttyd', '-p', '7681', 'login']
 
     def __init__(self) -> None:
-        self._process: subprocess.Popen | None = None
+        self._process: Optional[subprocess.Popen] = None
 
     def start(self) -> None:
         if self._process:
             return
 
         self._process = subprocess.Popen(self.TTYD_CMD, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
 
     def kill(self):
         if self._process:
             self._process.kill()
diff --git a/backend_py/src/services/wifi/network_manager.py b/backend_py/src/services/wifi/network_manager.py
index 6550a5b6695f832136a1ea3eeeea269c4ea19aec..ee70b92bb7f1be8beeef48a969c5222e8fb8ae4a 100644
--- a/backend_py/src/services/wifi/network_manager.py
+++ b/backend_py/src/services/wifi/network_manager.py
@@ -1,27 +1,27 @@
 import dbus
-from typing import List, Callable
+from typing import Callable, List, Optional
 import time
 from .wifi_types import Connection, AccessPoint
 import logging
 class NMException(Exception):
     '''Exception raised when there is a network manager issue'''
     pass
 
 class NMNotSupportedError(NMException):
     '''Exception raised when NetworkManager is not supported'''
     pass
 
 def handle_dbus_exceptions(func: Callable):
     '''
     Decorator to handle dbus exceptions, raising NMExceptions for more verbosity
     '''
 
     def wrapper(*args, **kwargs):
         try:
             return func(*args, **kwargs)
         except dbus.DBusException as e:
             raise NMException(f'DBusException occurred: {str(e)}') from e
         
     return wrapper
 
 class NetworkManager:
@@ -107,51 +107,51 @@ class NetworkManager:
         connection_path = settings_interface.AddConnection(connection_settings)
         self.interface.ActivateConnection(connection_path, dev_proxy, ap_path)
 
     @handle_dbus_exceptions
     def disconnect(self):
         '''
         Disconnect from any connected network
         '''
         (wifi_dev, dev_proxy) = self._get_wifi_device()
 
         if not wifi_dev:
             raise Exception('No WiFi device found')
 
         dev_props = dbus.Interface(dev_proxy, 'org.freedesktop.DBus.Properties')
         active_connection = dev_props.Get('org.freedesktop.NetworkManager.Device', 'ActiveConnection')
         self.interface.DeactivateConnection(active_connection)
 
     @handle_dbus_exceptions
     def list_wireless_connections(self) -> List[Connection]:
         '''
         Get a list of the active wireless connections
         '''
         return self.list_connections()
 
     @handle_dbus_exceptions
-    def get_active_wireless_connection(self) -> Connection | None:
+    def get_active_wireless_connection(self) -> Optional[Connection]:
         '''
         Get the first active wireless connection
         '''
         active_wireless_conections = list(self.get_active_connections())
         return None if len(active_wireless_conections) == 0 else active_wireless_conections[0]
 
     @handle_dbus_exceptions
     def list_connections(self, only_wireless=True) -> List[Connection]:
         '''
         Get a list of all the connections saved
         '''
         connections = []
         for connection in self._list_connections():
             config = connection.GetSettings()
             new_connection = Connection(config['connection']['id'], config['connection']['type'])
             # Filter
             if not only_wireless or 'wireless' in config['connection']['type'] and not new_connection in connections:
                 connections.append(new_connection)
         return connections
 
     @handle_dbus_exceptions
     def get_active_connections(self, wireless_only=True) -> List[Connection]:
         '''
         Get a list of active connections, including wired
         '''
diff --git a/backend_py/src/services/wifi/wifi_manager.py b/backend_py/src/services/wifi/wifi_manager.py
index fb84d82afc4d0e168a82d07c1ef034966a17df71..e1455a5ebfcd669ff03d6c36d672ee566a3f05d7 100644
--- a/backend_py/src/services/wifi/wifi_manager.py
+++ b/backend_py/src/services/wifi/wifi_manager.py
@@ -1,50 +1,52 @@
+from typing import Optional
+
 from .wifi_types import NetworkConfig, Status, Connection
 from .schemas import AccessPointSchema, ConnectionSchema, StatusSchema
 import threading
 import time
 import logging
 from .network_manager import NetworkManager, NMException, NMNotSupportedError
 from .exceptions import WiFiException
 
 class WiFiManager:
 
     def __init__(self, scan_interval=10) -> None:
         try:
             self.nm = NetworkManager()
         except NMException:
             raise WiFiException('NetworkManager is not supported')
         
         self._update_thread = threading.Thread(target=self._update)
         self._scan_thread = threading.Thread(target=self._scan) # Secondary thread is needed to conduct scans separately
         self._is_scanning = False
         self.scan_interval = scan_interval
         self.connections = []
 
-        self.to_forget: str | None = None
+        self.to_forget: Optional[str] = None
         self.to_disconnect = False
-        self.to_connect: NetworkConfig | None = None
+        self.to_connect: Optional[NetworkConfig] = None
 
         # Changed to true after successfully completed a scan
         self.status = Status(connection=Connection(), finished_first_scan=False, connected=False)
 
         # get initial access points before scan
         if self.nm is not None:
             try:
                 self.access_points = self.nm.get_access_points()
             except NMException as e:
                 raise WiFiException(f'Error occurred while initializing access points {e}') from e
         else:
             self.access_points = []
 
     def connect(self, ssid: str, password = ''):
         self.to_connect = NetworkConfig(ssid, password)
 
     def disconnect(self):
         self.to_disconnect = True
 
     def start_scanning(self):
         if self.nm is None:
             return
         logging.info('Starting WiFi Manager...')
         self._is_scanning = True
         self._update_thread.start()
diff --git a/backend_py/src/services/wifi/wifi_types.py b/backend_py/src/services/wifi/wifi_types.py
index b51473150f55626a8d9bda39a2ae1433989927e7..c13ecce83feb6b98b2af16b1b2be7a10955f075b 100644
--- a/backend_py/src/services/wifi/wifi_types.py
+++ b/backend_py/src/services/wifi/wifi_types.py
@@ -1,23 +1,24 @@
 from dataclasses import dataclass
+from typing import Optional
 
 @dataclass
 class NetworkConfig:
     ssid: str
     password: str = ''
 
 @dataclass
 class Connection:
-    id: str | None = None
-    type: str | None = None
+    id: Optional[str] = None
+    type: Optional[str] = None
 
 @dataclass
 class Status:
     connection: Connection
     finished_first_scan: bool
     connected: bool
 
 @dataclass
 class AccessPoint:
     ssid: str
     strength: int
     requires_password: bool
diff --git a/docker/Dockerfile b/docker/Dockerfile
index 048374bc4fd53f2cecbc987bf13b5a7444530867..fe7c4b16ec838b94717e2cb75897e8f97d73a8d7 100644
--- a/docker/Dockerfile
+++ b/docker/Dockerfile
@@ -1,27 +1,27 @@
 # Base image
-FROM python:3.10-slim-bullseye
+FROM python:3.9-slim-bullseye
 
 # Install dependencies
 RUN apt-get update -y && apt-get upgrade -y &&\
     apt-get install -y curl dbus wget sudo &&\
     apt-get clean
 
 RUN apt-get install -y \
     build-essential \
     gcc \
     libdbus-1-dev \
     libglib2.0-dev \
     python3-dev \
     pkg-config \
     dbus \
     dbus-x11
 
 # Copy requirements.txt with cache
 COPY release/backend_py/requirements.txt .
 
 # Copy apt requirements with cache
 COPY release/install_requirements.sh .
 
 RUN pip install --no-cache-dir -r requirements.txt
 
 RUN sh install_requirements.sh
 
EOF
)
