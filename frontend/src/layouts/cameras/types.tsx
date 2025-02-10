export enum DeviceType {
    EXPLOREHD = 0,
    STELLARHD_LEADER = 1,
    STELLARHD_FOLLOWER = 2,
}

/**
 * Represents a Device object. Same as the one defined in the backend
 */
export interface Device {
    cameras: Camera[];
    controls: Control[];
    bus_info: string;
    pid: number;
    vid: number;
    manufacturer: string;
    device_info: CameraInfo;
    nickname: string;
    options: StreamOptions;
    stream: Stream;

    device_type: DeviceType;
    is_leader: boolean | undefined;
    leader: string | undefined;
    follower: string | undefined;
}

export interface Camera {
    path: string;
    formats: { [index: string]: CameraFormatSize[] };
}

export interface CameraFormatSize {
    width: number;
    height: number;
    intervals: CameraInterval[];
}

/**
 * Represents a camera interval
 */
export interface CameraInterval {
    /* The stream interval numerator */
    numerator: number;
    /* The stream interval denominator */
    denominator: number;
}

/**
 * Represents a UVC control.
 */
export interface Control {
    flags: ControlFlags;
    /* The control ID */
    control_id: number;
    name: string;
    value: number;
}

export interface MenuItem {
    name: string;
    index: number;
}

export interface ControlFlags {
    default_value: number;
    disabled: boolean;
    grabbed: boolean;
    max_value: number;
    min_value: number;
    read_only: boolean;
    slider: number;
    step: number;
    control_type: controlType;
    update: number;
    volatility: number;
    write_only: boolean;
    menu?: MenuItem[];
}

export interface CameraInfo {
    device_name: string;
    bus_info: string;
    pid: number;
    vid: number;
    device_paths: string[];
}

export interface StreamOptions {
    bitrate: number;
    gop: number;
    mode: number;
}

export interface Stream {
    device_path: string;
    encode_type: encodeType;
    stream_type: streamType;
    endpoints: StreamEndpoint[];
    width: number;
    height: number;
    interval: CameraInterval;
    configured: boolean;
}

/* If we ever need to add more compression formats, just add them here */
export enum encodeType {
    MJPG = "MJPG",
    H264 = "H264",
}

export enum controlType {
    INTEGER = 1,
    BOOLEAN = 2,
    MENU = 3,
    BUTTON = 4,
    INTEGER64 = 5,
    CTRL_CLASS = 6,
    STRING = 7,
    BITMASK = 8,
    INTEGER_MENU = 9,
}

export enum bitrateMode {
    VBR = 2,
    CBR = 1,
}

export enum optionType {
    BITRATE = "BITRATE",
    GOP = "GOP",
    MODE = "MODE",
}

/* If we ever need to support more stream protocols, just add them here */
export enum streamType {
    UDP = "UDP",
}

export interface PortInfo {
    port: number;
}

/**
 * Represents a stream format.
 */
export interface StreamFormat {
    /* The stream width */
    width: number;
    /* The stream height */
    height: number;
    /* The stream interval */
    interval: CameraInterval;
}

/**
 * Represents a stream endpoint.
 */
export interface StreamEndpoint {
    /* The stream endpoint host */
    host: string;
    /* The stream endpoint port */
    port: number;
}
