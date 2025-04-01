import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContext, useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CameraIcon,
  Check,
  Edit2Icon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import DeviceContext from "@/contexts/DeviceContext";
import { subscribe, useSnapshot } from "valtio";
import { components } from "@/schemas/dwe_os_2";

const StreamSelector = ({
  options,
  placeholder,
  label,
  value,
  onChange,
  disabled = false,
}: {
  options: string[];
  placeholder: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full text-sm">
          <SelectValue
            placeholder={placeholder}
            className="truncate"
          ></SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((val) => (
              <SelectItem key={val} value={val}>
                {val}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

const Endpoint = ({
  endpoint,
  deleteEndpoint,
}: {
  endpoint: components["schemas"]["StreamEndpointModel"];
  deleteEndpoint: () => void;
}) => {
  const endpointState = useSnapshot(endpoint);

  const [isEditing, setIsEditing] = useState(false);

  const [tempHost, setTempHost] = useState(endpoint.host);
  const [tempPort, setTempPort] = useState(endpoint.port);

  return (
    <li className="flex items-start space-x-3">
      {/* ListItemIcon */}
      <div className="flex-shrink-0 text-muted-foreground pt-1">
        <CameraIcon className="w-5 h-5" />
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="min-w-0 flex-1 flex items-center justify-between">
          <div className="grid grid-cols-2 gap-2 flex-1 mr-2">
            <Input
              value={tempHost}
              placeholder="IP Address"
              className="h-8"
              onChange={(e) => setTempHost(e.target.value)}
            />
            <Input
              value={tempPort}
              placeholder="Port"
              className="h-8"
              onChange={(e) => setTempPort(parseInt(e.target.value))}
            />
          </div>
          <div className="flex space-x-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                setIsEditing(false);
                endpoint.host = tempHost;
                endpoint.port = tempPort;
              }}
            >
              <Check className="h-4 w-4" />
              <span className="sr-only">Save</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="min-w-0 flex-1 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Address: {endpointState.host}</p>
            <p className="text-xs text-muted-foreground">
              Port: {endpointState.port}
            </p>
          </div>
          <div className="flex flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsEditing(true)}
            >
              <Edit2Icon className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => deleteEndpoint()}
            >
              <Trash2Icon className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
      )}
    </li>
  );
};

const EndpointList = ({
  defaultHost,
  nextPort,
}: {
  defaultHost: string;
  nextPort: number;
}) => {
  const device = useContext(DeviceContext);

  // readonly device state
  const deviceState = useSnapshot(device!);

  return (
    <>
      <div className="relative">
        <Card>
          <CardHeader>
            <span className="text-base -m-2 font-xs leading-none">
              Endpoints
            </span>
          </CardHeader>
          <CardContent>
            {/* List */}
            <ul className="space-y-4">
              {deviceState.stream.endpoints.map((_, index) => (
                <Endpoint
                  endpoint={device!.stream.endpoints[index]}
                  deleteEndpoint={() =>
                    (device!.stream.endpoints = device!.stream.endpoints.filter(
                      (_, i) => i !== index
                    ))
                  }
                />
              ))}
            </ul>
          </CardContent>
        </Card>
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
          {/* Add Button */}
          <Button
            variant="outline"
            className="h-8 w-8 p-0 rounded-full shadow-md bg-card dark:bg-card flex items-center justify-center hover:bg-accent hover:text-accent-foreground"
            onClick={() =>
              device!.stream.endpoints.push({
                host: defaultHost,
                port: nextPort,
              })
            }
          >
            <PlusIcon />
          </Button>
        </div>
      </div>
      <div className="h-0.5"></div>
    </>
  );
};

const getResolution = (resolution: string) => {
  const split = resolution.split("x");
  if (split.length < 2) return [null, null];
  return [parseInt(split[0]), parseInt(split[1])];
};

/*
 * Get the list of resolutions available from the device
 */
const getResolutions = (
  device: Readonly<components["schemas"]["DeviceModel"]>,
  encodeFormat: components["schemas"]["StreamEncodeTypeEnum"]
) => {
  const newResolutions: string[] = [];

  for (const camera of device.cameras!) {
    const format = camera.formats[encodeFormat as string];
    if (format) {
      for (const resolution of format) {
        const resolution_str = `${resolution.width}x${resolution.height}`;
        if (newResolutions.includes(resolution_str)) continue;
        newResolutions.push(resolution_str);
      }
    }
  }
  return newResolutions;
};

const ENCODERS = ["H264", "MJPG", "SOFTWARE_H264"];

export const CameraStream = ({
  defaultHost,
  nextPort,
}: {
  defaultHost: string;
  nextPort: number;
}) => {
  const device = useContext(DeviceContext)!;

  // readonly device state
  const deviceState = useSnapshot(device);

  const [host, setHost] = useState(defaultHost);
  const [port, setPort] = useState(nextPort);

  const [streamEnabled, setStreamEnabled] = useState(
    deviceState.stream.configured
  );
  const [resolution, setResolution] = useState(
    `${deviceState.stream.width}x${deviceState.stream.height}`
  );
  const [fps, setFps] = useState("" + deviceState.stream.interval.denominator);
  const [format, setFormat] = useState(device.stream.encode_type);
  const [resolutions, setResolutions] = useState(
    getResolutions(device, deviceState.stream.encode_type)
  );
  const [intervals, setIntervals] = useState([] as string[]);
  const [encoders, setEncoders] = useState(
    [] as components["schemas"]["StreamEncodeTypeEnum"][]
  );

  useEffect(() => {
    device.stream.configured = streamEnabled;
  }, [streamEnabled, device]);

  useEffect(() => {
    const [width, height] = getResolution(resolution);
    device.stream.width = width!;
    device.stream.height = height!;
  }, [resolution, device]);

  subscribe(device.stream, () => {
    setResolutions(getResolutions(device, deviceState.stream.encode_type));
  });

  useEffect(() => {
    const cameraFormat = device.stream.encode_type;
    const newIntervals: string[] = [];
    for (const camera of device.cameras!) {
      const format = camera.formats[cameraFormat];
      if (format) {
        for (const resolution of format) {
          for (const interval of resolution.intervals) {
            if (!newIntervals.includes(interval.denominator.toString()))
              newIntervals.push(interval.denominator.toString());
          }
        }
      }
    }
    setIntervals(newIntervals);
  }, [resolutions, device]);

  useEffect(() => {
    const newEncoders = [];
    for (const camera of device.cameras!) {
      for (const format in camera.formats) {
        if (ENCODERS.includes(format)) {
          newEncoders.push(format);
        }
      }
    }
    setEncoders(newEncoders as components["schemas"]["StreamEncodeTypeEnum"][]);
  }, [device]);

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium leading-none">
        Stream Configuration
      </h3>

      <div className="grid grid-cols-3 gap-3 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5">
          <StreamSelector
            options={resolutions}
            placeholder="Resolution"
            label="Resolution"
            value={resolution}
            onChange={setResolution}
          />
        </div>

        <div className="sm:col-span-3">
          <StreamSelector
            options={intervals}
            placeholder="FPS"
            label="Frame Rate"
            value={fps}
            onChange={setFps}
          />
        </div>

        <div className="sm:col-span-4">
          <StreamSelector
            options={encoders}
            placeholder="Format"
            label="Format"
            value={format}
            onChange={(fmt) =>
              setFormat(fmt as components["schemas"]["StreamEncodeTypeEnum"])
            }
          />
        </div>
      </div>

      <EndpointList defaultHost={defaultHost} nextPort={nextPort} />

      <Separator className="my-2" />

      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm font-medium">
            Stream {streamEnabled ? "enabled" : "disabled"}
          </span>
          {/* {streamEnabled && (
            <p className="text-xs text-muted-foreground mt-1">
              {resolution} @ {fps}fps ({format})
            </p>
          )} */}
        </div>
        <Button
          variant={"ghost"}
          className="w-4 h-8"
          onClick={() => setStreamEnabled((prev) => !prev)}
        >
          {streamEnabled ? <PauseIcon /> : <PlayIcon />}
        </Button>
      </div>
    </div>
  );
};
