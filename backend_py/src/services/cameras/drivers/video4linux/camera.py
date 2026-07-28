import fcntl

from backend_py.src.models import FormatSizeModel, IntervalModel, StreamFormatModel

from ...camera_helper.camera_helper_loader import camera_helper
from ...stream_utils import fourcc2s
from . import v4l2


class Camera:
    """
    Camera base class
    """

    def __init__(self, path: str) -> None:
        self.path = path
        self._file_object = open(path)  # noqa: SIM115
        self._fd = self._file_object.fileno()  # get the file descriptor
        self._get_formats()

    def close(self) -> None:
        self._file_object.close()

    # uvc_set_ctrl function defined in uvc_functions.c
    def uvc_set_ctrl(self, unit: int, ctrl: int, data: bytes, size: int) -> int:
        return camera_helper.uvc_set_ctrl(self._fd, unit, ctrl, data, size)

    # uvc_get_ctrl function defined in uvc_functions.c
    def uvc_get_ctrl(self, unit: int, ctrl: int, data: bytes, size: int) -> int:
        return camera_helper.uvc_get_ctrl(self._fd, unit, ctrl, data, size)

    def has_format(self, pixformat: str) -> bool:
        return pixformat in self.formats

    def _get_formats(self) -> None:
        self.formats: dict[str, list[FormatSizeModel]] = {}
        for i in range(1000):
            v4l2_fmt = v4l2.v4l2_fmtdesc()
            v4l2_fmt.index = i
            v4l2_fmt.type = v4l2.V4L2_BUF_TYPE_VIDEO_CAPTURE
            try:
                fcntl.ioctl(self._fd, v4l2.VIDIOC_ENUM_FMT, v4l2_fmt)
            except OSError:
                break

            format_sizes = []
            for j in range(1000):
                frmsize = v4l2.v4l2_frmsizeenum()
                frmsize.index = j
                frmsize.pixel_format = v4l2_fmt.pixelformat
                try:
                    fcntl.ioctl(self._fd, v4l2.VIDIOC_ENUM_FRAMESIZES, frmsize)
                except OSError:
                    break
                if frmsize.type == v4l2.V4L2_FRMSIZE_TYPE_DISCRETE:
                    format_size = FormatSizeModel(
                        width=frmsize.discrete.width,
                        height=frmsize.discrete.height,
                        intervals=[],
                    )
                    for k in range(1000):
                        frmival = v4l2.v4l2_frmivalenum()
                        frmival.index = k
                        frmival.pixel_format = v4l2_fmt.pixelformat
                        frmival.width = frmsize.discrete.width
                        frmival.height = frmsize.discrete.height
                        try:
                            fcntl.ioctl(
                                self._fd, v4l2.VIDIOC_ENUM_FRAMEINTERVALS, frmival
                            )
                        except OSError:  # This is expected and/or possible
                            break
                        if frmival.type == v4l2.V4L2_FRMIVAL_TYPE_DISCRETE:
                            format_size.intervals.append(
                                IntervalModel(
                                    numerator=frmival.discrete.numerator,
                                    denominator=frmival.discrete.denominator,
                                )
                            )
                    format_sizes.append(format_size)
            self.formats[fourcc2s(v4l2_fmt.pixelformat)] = format_sizes

    def get_current_format(self) -> StreamFormatModel:
        """Get the currently active format"""
        fmt = v4l2.v4l2_format()
        fmt.type = v4l2.V4L2_BUF_TYPE_VIDEO_CAPTURE
        fcntl.ioctl(self._fd, v4l2.VIDIOC_G_FMT, fmt)

        parm = v4l2.v4l2_streamparm()
        parm.type = v4l2.V4L2_BUF_TYPE_VIDEO_CAPTURE
        fcntl.ioctl(self._fd, v4l2.VIDIOC_G_PARM, parm)

        return StreamFormatModel(
            width=fmt.fmt.pix.width,
            height=fmt.fmt.pix.height,
            interval=IntervalModel(
                numerator=parm.parm.capture.timeperframe.numerator,
                denominator=parm.parm.capture.timeperframe.denominator,
            ),
        )
