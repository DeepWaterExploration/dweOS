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
import { useToast } from "@/hooks/use-toast";
import DevicesContext from "@/contexts/DevicesContext";
import { getDeviceByBusInfo } from "@/lib/utils";
import { API_CLIENT } from "@/api";
import { CameraControls } from "./camera-controls";

// Options for StreamSelector should provide label and value for each choice
type StreamOption = { label: string; value: string };
const StreamSelector = ({
  options,
  placeholder,
  label,
  value,
  onChange,
  disabled = false,
}: {
  options: StreamOption[];
  placeholder: string;
  label: string;
  value?: string;
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
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
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
  setShouldPostFlag,
}: {
  defaultHost: string;
  nextPort: number;
  setShouldPostFlag: React.Dispatch<React.SetStateAction<boolean>>;
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
            {/* If there are no endpoints.... */}
            {deviceState.stream.endpoints.length === 0 ? (
              <div className="min-w-0 flex-1 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">No endpoints added</p>
                  <p className="text-xs text-muted-foreground">
                    Press the plus icon to add an endpoint
                  </p>
                </div>
              </div>
            ) : (
              <ul className="space-y-4">
                {/* If there are endpoints.... */}
                {deviceState.stream.endpoints.map((_, index) => (
                  <Endpoint
                    key={index}
                    endpoint={device!.stream.endpoints[index]}
                    deleteEndpoint={() => {
                      device!.stream.endpoints =
                        device!.stream.endpoints.filter((_, i) => i !== index);
                      setShouldPostFlag(true);
                    }}
                  />
                ))}
              </ul>
            )}
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

  const { devices, leaders } = useContext(DevicesContext)!;

  const { toast } = useToast();

  // readonly device state
  const deviceState = useSnapshot(device);

  const [streamEnabled, setStreamEnabled] = useState(
    deviceState.stream.enabled
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

  const [shouldPostFlag, setShouldPostFlag] = useState(false);

  const configureStream = () => {
    const [width, height] = getResolution(resolution);
    if (width === null || height === null) return;
    API_CLIENT.POST("/devices/configure_stream", {
      body: {
        bus_info: device.bus_info,
        encode_type: format, // use local state
        endpoints: device.stream.endpoints, // or lift endpoints into state too
        stream_format: {
          width,
          height,
          interval: { numerator: 1, denominator: Number(fps) }, // use local state
        },
        enabled: streamEnabled, // use local state
      },
    });
  };

  useEffect(() => {
    device.stream.enabled = streamEnabled;
  }, [streamEnabled]);

  useEffect(() => {
    device.stream.enabled = streamEnabled;
    if (device.follower) {
      const follower = getDeviceByBusInfo(devices, device.follower);
      if (!follower) {
        // follower was removed
        device.follower = "";
        device.is_leader = false;
        return;
      }
      if (follower.leader !== device.bus_info) {
        device.follower = "";
        return;
      }
      follower.stream.enabled = streamEnabled;
    }
  }, [streamEnabled]);

  useEffect(() => {
    const [width, height] = getResolution(resolution);
    device.stream.width = width!;
    device.stream.height = height!;
  }, [resolution]);

  useEffect(() => {
    device.stream.interval.denominator = parseInt(fps);
  }, [device, fps]);

  useEffect(() => {
    if (shouldPostFlag) {
      configureStream();
      setShouldPostFlag(false);
    }
  }, [shouldPostFlag]);

  useEffect(() => {
    device.stream.encode_type = format;
  }, [device, format]);

  subscribe(device.stream, () => {
    setResolutions(getResolutions(device, deviceState.stream.encode_type));

    if (device.stream.enabled && !streamEnabled) {
      setStreamEnabled(true);
    } else if (!device.stream.enabled && streamEnabled) {
      setStreamEnabled(false);
    }
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

  subscribe(device.stream.endpoints, () => {
    setShouldPostFlag(true);
  });

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
            options={resolutions.map((r) => ({ label: r, value: r }))}
            placeholder="Resolution"
            label="Resolution"
            value={resolution}
            onChange={(newResolution) => {
              setResolution(newResolution);
              setShouldPostFlag(true);
            }}
          />
        </div>

        <div className="sm:col-span-3">
          <StreamSelector
            options={intervals.map((i) => ({ label: i, value: i }))}
            placeholder="FPS"
            label="Frame Rate"
            value={fps}
            onChange={(newFps) => {
              setFps(newFps);
              setShouldPostFlag(true);
            }}
          />
        </div>

        <div className="sm:col-span-4">
          <StreamSelector
            options={encoders.map((e) => ({ label: e, value: e }))}
            placeholder="Format"
            label="Format"
            value={format}
            onChange={(fmt) => {
              setFormat(fmt as components["schemas"]["StreamEncodeTypeEnum"]);
              setShouldPostFlag(true);
            }}
          />
        </div>
      </div>

      {deviceState.device_type === 2 && (
        <StreamSelector
          options={[
            { label: "No Leader", value: "Unassigned" },
            ...leaders
              .filter((d) => d.bus_info !== device.bus_info)
              .map((d) => ({ label: d.bus_info, value: d.bus_info })),
          ]}
          placeholder="No Leader"
          label="Leader Device"
          value={deviceState.leader ? deviceState.leader : "Unassigned"}
          onChange={async (newLeader) => {
            try {
              if (newLeader === "Unassigned") {
                // Make the leader not a leader anymore
                getDeviceByBusInfo(devices, device.leader).is_leader = false;
                device.leader = undefined;
                API_CLIENT.POST("/devices/remove_leader", {
                  body: { follower: device.bus_info },
                });
              } else {
                device.leader = newLeader;
                const leader = getDeviceByBusInfo(devices, device.leader);
                leader.follower = device.bus_info;
                device.stream.enabled = leader.stream.enabled;
                leader.is_leader = true;

                API_CLIENT.POST("/devices/set_leader", {
                  body: { leader: device.leader, follower: device.bus_info },
                });
              }
              toast({
                title: "Leader updated",
                description: `Leader set to ${newLeader}`,
              });
            } catch (e) {
              toast({
                title: "Failed to set leader",
                description: (e as Error).message,
                variant: "destructive",
              });
            }
          }}
          disabled={leaders.length < 1 || deviceState.is_leader}
        />
      )}

      <EndpointList
        defaultHost={defaultHost}
        nextPort={nextPort}
        setShouldPostFlag={setShouldPostFlag}
      />
      <Separator className="my-2" />

      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm font-medium">
            Stream {streamEnabled ? "enabled" : "disabled"}
          </span>
        </div>
        <Button
          variant={"ghost"}
          className="w-4 h-8"
          onClick={() => {
            setStreamEnabled((prev) => {
              const newState = !prev;
              return newState;
            });
            setShouldPostFlag(true);
          }}
          disabled={!!device.leader}
        >
          {streamEnabled ? <PauseIcon /> : <PlayIcon />}
        </Button>
      </div>

      <CameraControls />
    </div>
  );
};
