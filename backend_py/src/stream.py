from dataclasses import dataclass
from typing import List
import subprocess
from multiprocessing import Process
import time
import shlex
import threading

from .camera_types import *

import logging

import gi
gi.require_version('Gst', '1.0')
from gi.repository import GLib, Gst


@dataclass
class Stream:
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
        match self.encode_type:
            case StreamEncodeTypeEnum.H264:
                return 'video/x-h264'
            case StreamEncodeTypeEnum.MJPG:
                return 'image/jpeg'
            case _:
                return ''

    def _build_source(self):
        return f'v4l2src device={self.device_path}'

    def _construct_caps(self):
        return f'{self._get_format()},width={self.width},height={self.height},framerate={self.interval.denominator}/{self.interval.numerator}'

    def _build_payload(self):
        match self.encode_type:
            case StreamEncodeTypeEnum.H264:
                return 'h264parse ! queue ! rtph264pay config-interval=10 pt=96'
            case StreamEncodeTypeEnum.MJPG:
                return 'rtpjpegpay'
            case _:
                return ''

    def _build_sink(self):
        match self.stream_type:
            case StreamTypeEnum.UDP:
                if len(self.endpoints) == 0:
                    return 'fakesink'
                sink = 'multiudpsink sync=true clients='
                for endpoint, i in zip(self.endpoints, range(len(self.endpoints))):
                    sink += f'{endpoint.host}:{endpoint.port}'
                    if i < len(self.endpoints)-1:
                        sink += ','

                return sink
            case _:
                return ''
            
    def start(*args):
        pass

    def stop(*args):
        pass

class StreamRunner:

    def __init__(self, *streams: Stream) -> None:
        self.streams = [*streams]
        self.pipeline = None
        self.loop = None
        self.started = False
        self.thread: threading.Thread = None

    def start(self):
        if self.started:
            self.stop()
        self._thread = threading.Thread(target=self._run_pipeline)
        self.started = True
        self._thread.start()

    def stop(self):
        if not self.started:
            return
        self.started = False
        self.pipeline.set_state(Gst.State.NULL)
        self.loop.quit()
        self._thread.join()
        del self._thread

    def _run_pipeline(self):
        Gst.init(None)

        pipeline_str = self._construct_pipeline()
        print(pipeline_str)
        self.pipeline = Gst.parse_launch(pipeline_str)

        self.loop = GLib.MainLoop()

        self.pipeline.set_state(Gst.State.PLAYING)
        try:
            self.loop.run()
        except:
            pass

        self.pipeline.set_state(Gst.State.NULL)

    def _construct_pipeline(self):
        pipeline_strs = []
        for stream in self.streams:
            pipeline_strs.append(stream._construct_pipeline())
        return ' '.join(pipeline_strs)
