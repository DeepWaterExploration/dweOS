"""
stream.py

Creates the GStreamer pipeline command to begin streaming from a camera as well as the process for ending a stream
"""

from dataclasses import dataclass, field
from datetime import datetime
import stat
from typing import List
import subprocess
import threading
import event_emitter as events

from .pydantic_schemas import *

import logging
import os

from abc import ABC, abstractmethod

# @dataclass
# class Stream(events.EventEmitter):
#     device_path: str = ""
#     encode_type: StreamEncodeTypeEnum = None
#     stream_type: StreamTypeEnum = StreamTypeEnum.UDP
#     endpoints: List[StreamEndpointModel] = field(default_factory=list)
#     width: int = None
#     height: int = None
#     interval: IntervalModel = field(
#         default_factory=lambda: IntervalModel(numerator=1, denominator=30)
#     )
#     enabled: bool = False

#     software_h264_bitrate = 5000

#     file_path: str|None = None

#     def _construct_pipeline(self):
#         return f"{self._build_source()} ! {self._construct_caps()} ! {self._build_payload()} ! {self._build_sink()}"

#     def _get_format(self):
#         match self.encode_type:
#             case StreamEncodeTypeEnum.H264:
#                 return "video/x-h264"
#             case StreamEncodeTypeEnum.MJPG:
#                 return "image/jpeg"
#             case StreamEncodeTypeEnum.SOFTWARE_H264:
#                 return "image/jpeg"  # from jpeg to h.264
#             case _:
#                 return ""

#     def _build_source(self):
#         return f"v4l2src device={self.device_path}"

#     def _construct_caps(self):
#         return f"{self._get_format()},width={self.width},height={self.height},framerate={self.interval.denominator}/{self.interval.numerator}"

#     def _build_payload(self):
#         match self.encode_type:
#             case StreamEncodeTypeEnum.H264:
#                 if self.stream_type == StreamTypeEnum.RECORDING:
#                     return f"h264parse ! video/x-h264,width={self.width},height={self.height},framerate={self.interval.denominator}/{self.interval.numerator} ! queue ! mp4mux"
#                 else:
#                     return "h264parse ! queue ! rtph264pay config-interval=10 pt=96"
#             case StreamEncodeTypeEnum.MJPG:
#                 if self.stream_type == StreamTypeEnum.RECORDING:
#                     return "queue ! avimux"
#                 else:
#                     return "rtpjpegpay"
#             case StreamEncodeTypeEnum.SOFTWARE_H264:
#                 if self.stream_type == StreamTypeEnum.RECORDING:
#                     return f"jpegdec ! queue ! x264enc byte-stream=false tune=zerolatency bitrate={self.software_h264_bitrate} speed-preset=ultrafast ! h264parse ! video/x-h264,width={self.width},height={self.height},framerate={self.interval.denominator}/{self.interval.numerator} ! queue ! mp4mux"
#                 else:
#                     return f"jpegdec ! queue ! x264enc byte-stream=true tune=zerolatency bitrate={self.software_h264_bitrate} speed-preset=ultrafast ! rtph264pay config-interval=10 pt=96"
#             case _:
#                 return ""

#     def _build_sink(self):
#         match self.stream_type:
#             case StreamTypeEnum.UDP:
#                 if len(self.endpoints) == 0:
#                     return "fakesink"
#                 sink = "multiudpsink sync=true clients="
#                 for endpoint, i in zip(self.endpoints, range(len(self.endpoints))):
#                     sink += f"{endpoint.host}:{endpoint.port}"
#                     if i < len(self.endpoints) - 1:
#                         sink += ","

#                 return sink
#             case StreamTypeEnum.RECORDING:
#                 home_dir = os.getcwd()
#                 video_dir = os.path.join(home_dir, "videos")
#                 if not os.path.exists(video_dir):
#                     os.makedirs(video_dir)
#                 permissions = stat.S_IRWXU | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH
#                 os.chmod(video_dir, permissions)
#                 extension = "avi" if self.encode_type == StreamEncodeTypeEnum.MJPG else "mp4"
#                 timestamp = datetime.now().strftime("%F-%T")
#                 unique_filename = f"{self.device_path.split('/')[-1]}_{timestamp}.{extension}"
#                 unique_path = os.path.join(video_dir, unique_filename)
#                 if os.path.exists(unique_path):
#                     unique_filename = f"{self.device_path.split('/')[-1]}_{timestamp}_{os.getpid()}.{extension}"
#                 unique_path = os.path.join(video_dir, unique_filename)
#                 self.file_path = unique_path
#                 return f"filesink location={unique_path} sync=true"
#             case _:
#                 return ""

#     def start(*args):
#         pass

#     def stop(*args):
#         pass


@dataclass
class Stream:
    device_path: str = ""
    encode_type: StreamEncodeTypeEnum = None
    width: int = None
    height: int = None
    fps: int = None


class StreamRunner(ABC):

    @abstractmethod
    def start():
        ...

    @abstractmethod
    def stop():
        ...

# class StreamRunner(events.EventEmitter):

#     def __init__(self, *streams: Stream) -> None:
#         super().__init__()
#         self.streams = [*streams]
#         self.pipeline = None
#         self.loop = None
#         self.started = False
#         self.error_thread = None
#         self.started_time = 0
#         self._lock = threading.RLock()

#         self.logger = logging.getLogger("dwe_os_2.cameras.StreamRunner")

#     def start(self):
#         with self._lock:
#             self.logger.info(
#                 f"Starting stream for followers: {[stream.device_path for stream in self.streams]}")
#             if self.started:
#                 self.stop()
#             self.started = True
#             self._run_pipeline()

#     def stop(self):
#         with self._lock:
#             if not self.started or not self._process:
#                 return

#             self.logger.info("Stopping stream")
#             self.started = False
            
#             # For recording streams, send EOS to properly finalize the file
#             has_recording_stream = any(stream.stream_type == StreamTypeEnum.RECORDING for stream in self.streams)
            
#             if has_recording_stream:
#                 try:
#                     # Send EOS signal to properly close the file
#                     self._process.send_signal(2)  # SIGINT for graceful EOS
#                     self._process.wait(timeout=10)  # Wait longer for recording finalization
#                 except subprocess.TimeoutExpired:
#                     self.logger.warning("EOS timeout, force killing recording process")
#                     self._process.kill()
#                     self._process.wait()
#                 except:
#                     self._process.kill()
#                     self._process.wait()
#                 if self._process.stderr:
#                     self._process.stderr.close()
#                 self._process = None
#                 self.error_thread.join()
                    
                
#                 self._process = None
#                 if self.error_thread and self.error_thread.is_alive():
#                     self.error_thread.join(timeout=2)
#             else:
#                 try:
#                     self._process.terminate()
#                     self._process.wait(timeout=5)  # Wait up to 5 seconds for graceful shutdown
#                 except subprocess.TimeoutExpired:
#                     # If graceful shutdown fails, force kill
#                     self.logger.warning("Graceful shutdown timed out, force killing process")
#                     self._process.kill()
#                     self._process.wait()
#                 except:
#                     # If terminate fails, force kill
#                     self._process.kill()
#                     self._process.wait()
#                 if self._process.stderr:
#                     self._process.stderr.close()
#                 self._process = None
#                 self.error_thread.join()
                
            

#     def _run_pipeline(self):
#         pipeline_str = self._construct_pipeline()
#         self.logger.info(pipeline_str)
#         has_recording_stream = any(stream.stream_type == StreamTypeEnum.RECORDING for stream in self.streams)
#         self._process = subprocess.Popen(
#             f"gst-launch-1.0 {'-e' if has_recording_stream else ''} {pipeline_str}".split(" "),
#             stdout=subprocess.DEVNULL,
#             stderr=subprocess.PIPE,
#             text=True,
#         )
#         self.error_thread = threading.Thread(target=self._log_errors)
#         self.error_thread.start()

#     def _construct_pipeline(self):
#         pipeline_strs = []
#         for stream in self.streams:
#             pipeline_strs.append(stream._construct_pipeline())
#         return " ".join(pipeline_strs)

#     def _log_errors(self):
#         error_block = []
#         try:
#             for stderr_line in iter(self._process.stderr.readline, ""):
#                 line_stripped = stderr_line.strip()

#                 # Log all stderr output but only stop on actual errors
#                 if any(error_keyword in line_stripped.lower() for error_keyword in ['error', 'failed', 'critical']):
#                     # Ignore known non-critical DMA warnings that don't affect functionality
#                     if "_dma_fmt_to_dma_drm_fmts: assertion 'fmt != GST_VIDEO_FORMAT_UNKNOWN' failed" in line_stripped:
#                         self.logger.warning(f"GStreamer DMA Warning (non-critical): {line_stripped}")
#                         continue
                        
#                     if "Failed to allocate required memory" in line_stripped and any(
#                         stream.stream_type == StreamTypeEnum.RECORDING for stream in self.streams
#                     ):
#                         for stream in self.streams:
#                             if stream.stream_type == StreamTypeEnum.RECORDING and stream.file_path:
#                                 print(str(stream.file_path))
#                                 # If we never get to write the file, remove it
#                                 os.remove(stream.file_path)
#                                 stream.file_path = None
                        

#                     error_block.append(stderr_line)
#                     self.logger.error(f"GStreamer Error: {line_stripped}")
#                     self.stop()
#                     break
#                 else:
#                     # Log as debug/info for non-error messages
#                     if 'warning' in line_stripped.lower():
#                         self.logger.warning(f"GStreamer Warning: {line_stripped}")
#                     else:
#                         self.logger.debug(f"GStreamer Info: {line_stripped}")
#         except:
#             pass
#         if len(error_block) > 0:
#             self.stop()
#             self.emit("gst_error", error_block)
