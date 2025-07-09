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
  MonitorPlayIcon,
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

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { set } from "date-fns";

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
        <SelectTrigger className="w-full text-sm outline-none focus:ring-1 focus:ring-inset focus:ring-primary/50">
          <SelectValue
            placeholder={placeholder}
            className="truncate"
          ></SelectValue>
        </SelectTrigger>
        <SelectContent className="">
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
  const [tempRtmpUrl, setTempRtmpUrl] = useState(endpoint.rtmp_url);
  const [youtubeKey, setYoutubeKey] = useState(tempRtmpUrl?.split("/").pop() || "");

  const [hideYt, setHideYt] = useState(endpoint.rtmp_url !== null);

  return (
    <li className="flex items-start space-x-3">
      <div className="flex-shrink-0 text-muted-foreground pt-1">
        {endpointState.rtmp_url ? (
          <MonitorPlayIcon className="w-5 h-5" />
        ) : (
          <CameraIcon className="w-5 h-5" />
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="min-w-0 flex-1 flex items-center justify-between">
          <div className="grid grid-cols-2 gap-2 flex-1 mr-2">
            {!hideYt ? (
              <>
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
                /></>) : (
              <Input
                value={youtubeKey}
                placeholder="Youtube Key"
                className="h-8"
                onChange={(e) => {
                  setYoutubeKey(e.target.value);
                  if (e.target.value.trim() === "") {
                    setTempRtmpUrl(null);
                    return;
                  }
                  setTempRtmpUrl(`rtmp://a.rtmp.youtube.com/live2/${e.target.value}`);
                }}
              />
            )}
          </div>
          <div className="flex space-x-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                setIsEditing(false);
                if (tempRtmpUrl === null) {
                  setHideYt(false)
                }
                endpoint.host = tempHost;
                endpoint.port = tempPort;
                endpoint.rtmp_url = tempRtmpUrl || null;
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
            {endpointState.rtmp_url ? (
              <>
                <p className="text-sm font-medium">Youtube Livestream</p>
                <p className="text-xs text-muted-foreground">
                  Key: {youtubeKey}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">Address: {endpointState.host}</p>
                <p className="text-xs text-muted-foreground">
                  Port: {endpointState.port}
                </p>
              </>
            )}
          </div>
          <div className="flex flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 mr-1"
              onClick={() => {
                if (hideYt) {
                  setTempRtmpUrl(null);
                  setYoutubeKey("");
                  endpoint.rtmp_url = null;
                };
                setHideYt(!hideYt);
                setIsEditing(true);
              }}
            >
              {!hideYt ? (
                <>
                  <MonitorPlayIcon className="h-4 w-4" />
                  <span className="sr-only">Stop</span>
                </>
              ) : (
                <>
                  <CameraIcon className="h-4 w-4" />
                  <span className="sr-only">Start</span>
                </>
              )}
            </Button>
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
      )
      }
    </li >
  );
};

const EndpointList = ({
  defaultHost,
  nextPort,
  setShouldPostFlag,
  ChangeFromMJPEG,
}: {
  defaultHost: string;
  nextPort: number;
  setShouldPostFlag: React.Dispatch<React.SetStateAction<boolean>>;
  ChangeFromMJPEG: () => void;
}) => {
  const device = useContext(DeviceContext);

  // readonly device state
  const deviceState = useSnapshot(device!);

  useEffect(() => {
    // Check if any endpoint has YouTube RTMP URL and current format is MJPEG
    const hasYoutubeEndpoint = deviceState.stream.endpoints.some((e) => e.rtmp_url !== null);

    if (hasYoutubeEndpoint && deviceState.stream.encode_type === "MJPG") {
      ChangeFromMJPEG(); // YouTube does not support MJPEG, so we need to change the format
      setShouldPostFlag(true);
    }
    if (deviceState.stream.endpoints.some((e) => e.rtmp_url !== null) && deviceState.stream.endpoints.some((e) => e.rtmp_url === null)) {
      device!.stream.endpoints = deviceState.stream.endpoints.filter((e) => e.rtmp_url !== null);
      setShouldPostFlag(true);
    }
  }, [deviceState.stream.endpoints, deviceState.stream.encode_type]);

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
                rtmp_url: null, // Default to null for RTMP
              })
            }
            disabled={device!.stream.endpoints.some((e) => e.rtmp_url === null)}
          >
            <PlusIcon />
          </Button>
        </div>
      </div>
      <div className="h-0.5"></div>
    </>
  );
};

const FollowerList = () => {
  const device = useContext(DeviceContext)!;

  const deviceState = useSnapshot(device);
  const [followers, setFollowers] = useState(device.followers);

  console.log(device.followers);

  const { devices } = useContext(DevicesContext)!;

  subscribe(device.followers, () => {
    setFollowers(device.followers);
  });

  const [potentialFollowers, setPotentialFollowers] = useState<string[]>([]);

  const updatePotentialFollowers = () => {
    setPotentialFollowers([
      "Select a device...",
      ...devices
        .filter((d) => d.device_type == 2)
        .map((f) => f.bus_info)
        .filter((value) => !followers.includes(value)),
    ]);
  };

  useEffect(() => {
    updatePotentialFollowers();
  }, [devices]);

  useEffect(() => {
    followers
      .filter((value) => !deviceState.followers.includes(value))
      .forEach((newFollower) => {
        device.followers = followers;
        API_CLIENT.POST("/devices/add_follower", {
          body: {
            leader_bus_info: deviceState.bus_info,
            follower_bus_info: newFollower,
          },
        });
        const dev = getDeviceByBusInfo(devices, newFollower);
        if (dev) dev.is_managed = true;
        updatePotentialFollowers();

        setSelectedBusInfo("Select a device...");
      });

    deviceState.followers
      .filter((value) => !followers.includes(value))
      .forEach((removedFollower) => {
        device.followers = followers;
        API_CLIENT.POST("/devices/remove_follower", {
          body: {
            leader_bus_info: deviceState.bus_info,
            follower_bus_info: removedFollower,
          },
        });
        const dev = getDeviceByBusInfo(devices, removedFollower);
        if (dev) dev.is_managed = false;
        updatePotentialFollowers();

        setSelectedBusInfo("Select a device...");
      });
  }, [followers]);

  const [selectedBusInfo, setSelectedBusInfo] = useState("Select a device...");

  const handleAddFollower = () => {
    const selected = devices.find(
      (f) => f.bus_info === selectedBusInfo
    )?.bus_info;
    if (!selected) return;

    setFollowers([...followers, selected]);
  };

  const handleDeleteFollower = (follower: string) => {
    setFollowers((oldFollowers) => oldFollowers.filter((f) => f !== follower));
  };

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="followers">
        <AccordionTrigger className="text-sm font-semibold">
          Followers
        </AccordionTrigger>
        <AccordionContent className="w-full">
          <div className="space-y-4">
            {/* Add Dropdown */}
            <div className="grid grid-cols-12 gap-3 w-full items-end">
              <div className="col-span-9">
                <StreamSelector
                  options={potentialFollowers.map((f) => ({
                    label: `${f}`,
                    value: f,
                  }))}
                  placeholder="Select a device..."
                  label="Add Follower"
                  value={selectedBusInfo}
                  onChange={setSelectedBusInfo}
                />
              </div>

              <div className="col-span-3">
                <Button onClick={handleAddFollower} className="w-full">
                  Add
                </Button>
              </div>
            </div>

            {/* Follower Table */}
            {followers.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 border rounded-md bg-muted/50">
                No followers connected. Devices that mirror this stream will
                appear here.
              </div>
            ) : (
              <div className="rounded-md border w-full overflow-hidden">
                <table className="w-full table-fixed text-sm text-left">
                  <thead className="bg-muted/30 border-b">
                    <tr>
                      <th className="px-4 py-2 w-1/2 truncate font-medium">
                        Port
                      </th>
                      <th className="px-4 py-2 w-1/2 truncate font-medium">
                        Device Type
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {followers.map((follower, index) => (
                      <tr key={index} className="border-b hover:bg-muted/10">
                        <td className="px-4 py-2 truncate">{follower}</td>
                        <td className="px-4 py-2">
                          <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                            <span className="truncate">stellarHD</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFollower(follower)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2Icon className="w-4 h-4" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
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
    var stream_type = "UDP";
    if (device.stream.endpoints.every((e) => e.rtmp_url !== null)) {
      stream_type = "RTMP";
    }
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
        stream_type,
        enabled: streamEnabled, // use local state
      },
    });
  };

  function ChangeFromMJPEG() {
    console.log("Changing from MJPEG to another format");
    if (device.stream.encode_type === "MJPG") {
      toast({
        title: "Changing stream format",
        description: `Changing from MJPEG to ${encoders.filter((e) => e !== "MJPG")[0]}.`,
        duration: 1000
      });
    } else {
      return;
    }
    setFormat(encoders.filter((e) => e !== "MJPG")[0]);
  }

  useEffect(() => {
    device.stream.enabled = streamEnabled;
  }, [device.stream, streamEnabled]);

  useEffect(() => {
    device.stream.enabled = streamEnabled;
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
            // disabled={deviceState.is_managed}
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
            // disabled={deviceState.is_managed}
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
            // disabled={deviceState.is_managed}
            onChange={(fmt) => {
              setFormat(fmt as components["schemas"]["StreamEncodeTypeEnum"]);
              setShouldPostFlag(true);
            }}
          />
        </div>
      </div>

      <EndpointList
        defaultHost={defaultHost}
        nextPort={nextPort}
        setShouldPostFlag={setShouldPostFlag}
        ChangeFromMJPEG={ChangeFromMJPEG}

      />
      <Separator className="my-2" />

      {deviceState.device_type == 1 && <FollowerList />}

      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm font-medium">
            Stream{" "}
            {deviceState.is_managed
              ? "managed"
              : streamEnabled
                ? "enabled"
                : "disabled"}
          </span>
        </div>
        <Button
          variant={"ghost"}
          className="w-4 h-8"
          disabled={deviceState.is_managed}
          onClick={() => {
            setStreamEnabled((prev) => {
              const newState = !prev;
              return newState;
            });
            setShouldPostFlag(true);
          }}
        >
          {streamEnabled ? <PauseIcon /> : <PlayIcon />}
        </Button>
      </div>

      <CameraControls />
    </div>
  );
};
