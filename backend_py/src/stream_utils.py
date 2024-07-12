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
    match encode_type:
        case StreamEncodeTypeEnum.MJPG:
            return 'MJPG'
        case StreamEncodeTypeEnum.H264:
            return 'H264'
    return None

def string_to_stream_encode_type(encoding: str):
    match encoding:
        case 'MJPG':
            return StreamEncodeTypeEnum.MJPG
        case 'H264':
            return StreamEncodeTypeEnum.H264
    return None