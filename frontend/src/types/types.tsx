/**
 * Represents a Device object. Same as the one defined in the backend
 */
export interface Device {
  cameras: Camera[];
  controls: Control[];
  info: CameraInfo;
  options: StreamOptions;
  stream: Stream;
}

export interface Camera {
  device_path: string;
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
  id: number;
  name: string;
  value: number;
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
  menu?: number[] | string[];
}

export interface CameraInfo {
  /* Differentiator between cameras (device path) */
  name: string;
  path: string;
  pid: string;
  usbInfo: string;
  vid: string;
  manufacturer: string;
  model: string;
  nickname: string;
}

export interface StreamOptions {
  bitrate: number;
  gop: number;
  mode: bitrateMode;
}

export interface Stream {
  device_path: string;
  encode_type: encodeType;
  stream_type: streamType;
  endpoints: StreamEndpoint[];
  format: StreamFormat;
}

/* If we ever need to add more compression formats, just add them here */
export enum encodeType {
  MJPEG = "MJPEG",
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
  VBR = "VBR",
  CBR = "CBR",
}

export enum optionType {
  BITRATE = "bitrate",
  GOP = "gop",
  MODE = "mode",
}

/* If we ever need to support more stream protocols, just add them here */
export enum streamType {
  UDP = "UDP",
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

/**
 * Represents a route in a navigation system.
 */
export interface RouteItem {
  /* The path for the route */
  route: string;
  /* The component rendered when the route is matched */
  component: React.ReactNode;
  /* (Optional) Whether matches to the route should be exact */
  exact?: boolean;
  /* The icon associated with this route */
  icon: React.ReactElement;
  /* The category the route belongs to */
  category: string;
  /* The type of route */
  type: routeType;
  /* A descriptive name for the route, used for display purposes */
  name: string;
  /* A unique key to identify the route, used when rendering dynamic routes */
  key: string;
  /* Whether the route is the default route */
  default: boolean;
}

/**
 * Represents the types of routes used in the navigation system
 */
export enum routeType {
  /* Collapsible group of routes */
  COLLAPSE = "collapse",
  /* A single route item */
  ITEM = "item",
}

/* Updater */

export interface Release {
  body: string;
  name: string;
  prerelease: boolean;
  published_at: string;
  tag_name: string;
  url: string;
  current: boolean;
  mostRecent: boolean;
}

export interface ReleaseList {
  releases: Release[];
}
