from dataclasses import dataclass
from typing import List
import subprocess
from multiprocessing import Process
import time

from camera_types import *


@dataclass
class Stream:
    device_path: str = ''
    encode_type: StreamEncodeTypeEnum = StreamEncodeTypeEnum.H264
    stream_type: StreamTypeEnum = StreamTypeEnum.UDP
    endpoints: List[StreamEndpoint] = field(default_factory=list)
    width: int = 1920
    height: int = 1080
    interval: Interval = Interval(1, 30)

    started: bool = False

    _process: Process = None

    def _start(self):
        pipeline_str = self._construct_pipeline()
        print(pipeline_str)
        subprocess.run(
            f'gst-launch-1.0 {pipeline_str}'.split(' '), stdout=subprocess.PIPE)

    def start(self):
        if self._process:
            self.stop()
        self.started = True
        self._process = Process(target=self._start)
        self._process.start()
        # self._process.wait()

    def stop(self):
        if not self.started:
            return
        self.started = False
        self._process.kill()

    def _construct_pipeline(self):
        return f'{self._build_source()} ! {self._construct_caps()} ! {self._build_payload()} ! {self._build_sink()}'

    def _get_format(self):
        match self.encode_type:
            case StreamEncodeTypeEnum.H264:
                return 'video/x-h264'
            case StreamEncodeTypeEnum.MJPEG:
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
                return 'h264parse ! queue ! rtph264pay name=pay0 config-interval=10 pt=96'
            case StreamEncodeTypeEnum.MJPEG:
                return 'rtpjpegpay'
            case _:
                return ''

    def _build_sink(self):
        match self.stream_type:
            case StreamTypeEnum.UDP:
                if len(self.endpoints) == 0:
                    return 'fakesink'
                sink = 'multiudpsink clients='
                for endpoint in self.endpoints:
                    sink += f'{endpoint.host}:{endpoint.port}'
                return sink
            case _:
                return ''
