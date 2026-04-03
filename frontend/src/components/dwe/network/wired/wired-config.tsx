import { API_CLIENT } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { components } from "@/schemas/dwe_os_2";
import { useContext, useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CameraIcon,
  Check,
  Edit2Icon,
  Globe,
  Network,
  PlusIcon,
  SettingsIcon,
  Trash2Icon,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import WebsocketContext from "@/contexts/WebsocketContext";
import { IP_REGEX } from "../../preferences/preferences";

type WiredDeviceModel = components["schemas"]["WiredDeviceModel"];

type ConnectionProfileModel = components["schemas"]["ConnectionProfileModel"];

type IPV4Configuration = components["schemas"]["IPV4Configuration"];

const DeviceStateLookup = {
  0: "UNKNOWN",
  10: "UNMANAGED",
  20: "UNAVAILABLE",
  30: "DISCONNECTED",
  40: "PREPARE",
  50: "CONFIG",
  60: "NEED_AUTH",
  70: "IP_CONFIG",
  80: "IP_CHECK",
  90: "SECONDARIES",
  100: "ACTIVATED",
  110: "DEACTIVATING",
  120: "FAILED",
};

function AddressEdit({
  address,
  prefix,
  onUpdate,
  onDelete,
}: {
  address?: string;
  prefix?: number;
  key: string;
  onUpdate: (address: string, prefix: number) => void;
  onDelete: () => void;
}) {
  const [addressState, setAddressState] = useState(address || "");
  const [prefixState, setPrefixState] = useState(prefix?.toString() || "");
  const [isValidPrefix, setIsValidPrefix] = useState(true);

  useEffect(() => {
    if (
      !isNaN(Number(prefixState)) &&
      Number.isInteger(parseInt(prefixState))
    ) {
      const newPrefix = parseInt(prefixState);
      console.log(newPrefix);
      if (
        newPrefix !== prefix ||
        (addressState != address && IP_REGEX.test(addressState))
      ) {
        onUpdate(addressState, newPrefix);
        setIsValidPrefix(true);
      }
    } else {
      setIsValidPrefix(false);
    }
  }, [addressState, prefixState, onUpdate, prefix]);

  return (
    <TableRow>
      <TableCell>
        <Input
          value={addressState}
          className={cn(
            "h-8",
            !IP_REGEX.test(addressState) && "border-red-500",
          )}
          onChange={(e) => {
            setAddressState(e.target.value);
          }}
        />
      </TableCell>
      <TableCell>
        <Input
          id="prefix"
          value={prefixState}
          className={cn("h-8", !isValidPrefix && "border-red-500")}
          onChange={(e) => {
            setPrefixState(e.target.value);
          }}
        />
      </TableCell>

      <TableCell className="w-[50px]">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500"
          onClick={onDelete}
        >
          <Trash2Icon className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </TableCell>
    </TableRow>
  );
}

function EditProfileDialog({
  profile,
  isOpen,
  setIsOpen,
  device,
  onSave,
}: {
  profile: ConnectionProfileModel;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  device?: WiredDeviceModel;
  onSave: (newConfig: IPV4Configuration) => void;
}) {
  const config = profile.ipv4_settings;

  const [method, setMethod] = useState(config.method || "auto");
  const [ipAddresses, setIpAddresses] = useState(config.ip_addresses || []);
  const [gateway, setGateway] = useState(config.gateway || "");
  const [dns, setDns] = useState(config.dns?.join(", ") || "");
  const [neverDefault, setNeverDefault] = useState(
    config.never_default || false,
  );

  useEffect(() => {
    if (isOpen && config) {
      setMethod(config.method);
      setIpAddresses(config.ip_addresses || []);
      setGateway(config.gateway || "");
      setDns(config.dns?.join(", ") || "");
    }
  }, [isOpen, config]);

  const handleSave = () => {
    console.log(ipAddresses);
    const updatedConfig: IPV4Configuration = {
      method: method as components["schemas"]["IPV4Method"],
      ip_addresses: method === "manual" && ipAddresses ? ipAddresses : [],
      gateway: method === "manual" ? gateway : "",
      dns:
        method === "manual" && dns ? dns.split(",").map((d) => d.trim()) : [],
      never_default: neverDefault,
    };
    onSave(updatedConfig);
    setIsOpen(false);
  };

  if (!profile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit "{profile.id}"</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>IPv4 Method</Label>
            <Select
              value={method}
              onValueChange={(value) =>
                setMethod(value as "manual" | "auto" | "unknown")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automatic (DHCP)</SelectItem>
                <SelectItem value="manual">Manual (Static IP)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Manual */}
          {method == "manual" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="grid space-y-3">
                <Label>IP Addresses</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Address</TableHead>
                      <TableHead>Prefix</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ipAddresses.map((address, index) => (
                      <AddressEdit
                        address={address.address}
                        prefix={address.prefix}
                        key={"" + index}
                        onUpdate={(address, prefix) => {
                          setIpAddresses((prev) =>
                            prev.map((element, updateIndex) =>
                              updateIndex === index
                                ? { address, prefix }
                                : element,
                            ),
                          );
                        }}
                        onDelete={() => {
                          setIpAddresses((prev) =>
                            prev.filter(
                              (_, deletedIndex) => deletedIndex !== index,
                            ),
                          );
                        }}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="w-full flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className=""
                  onClick={() =>
                    setIpAddresses([
                      ...ipAddresses,
                      { address: "", prefix: 24 },
                    ])
                  }
                >
                  <PlusIcon className="w-4 h-4 mr-2" /> Add IP Address
                </Button>
              </div>

              <div className="grid gap-2">
                <Label>DNS Servers</Label>
                <Input
                  value={dns}
                  onChange={(e) => setDns(e.target.value)}
                  placeholder="8.8.8.8, 1.1.1.1"
                />
              </div>

              <div className="grid gap-2">
                <Label>Gateway</Label>
                <Input
                  value={gateway}
                  onChange={(e) => setGateway(e.target.value)}
                  placeholder="192.168.2.1"
                />
              </div>
            </div>
          )}

          {/* Shared settings */}
          <div className="pt-4 border-t space-y-3">
            <Label>Routing Preferences</Label>
            <div className="flex items-start space-x-3 space-y-0 p-2">
              <Checkbox
                id="use-internet"
                checked={!neverDefault}
                onClick={() => setNeverDefault((prev) => !prev)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="use-internet">
                  Use for Internet (Default Route)
                </Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Apply Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConnectionProfile({
  profile,
  isActive,
  onSelect,
  master_device,
}: {
  profile: ConnectionProfileModel;
  isActive: boolean;
  master_device?: WiredDeviceModel;
  onSelect: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const onSave = (newIPConfiguration: IPV4Configuration) => {
    API_CLIENT.POST("/api/network/update_connection_profile", {
      params: {
        query: { path: profile.path },
      },
      body: newIPConfiguration,
    });
  };

  return (
    <>
      <EditProfileDialog
        device={master_device}
        isOpen={isEditing}
        setIsOpen={setIsEditing}
        onSave={onSave}
        profile={profile}
      />
      <li
        className={cn(
          "flex items-center space-x-3 pt-3 pb-3 relative rounded-md border transition-all cursor-pointer",
          isActive
            ? "bg-accent/50 border-primary/50 shadow-sm" // Active styling
            : "bg-background border-transparent hover:bg-accent/30", // Inactive hover styling
        )}
        onClick={onSelect}
      >
        {/* Icon Area */}
        <div className="flex-shrink-0"></div>

        {/* Text Content */}
        <div className="min-w-0 flex-1 flex items-center justify-between">
          <div className="flex flex-col w-full">
            <div className="flex items-start items-center justify-between w-full">
              <div className="grid grid-cols-2 items-center  space-x-3">
                <span className="text-sm font-medium">{profile.id}</span>
                {isActive && <Check className="h-4 w-4" />}
              </div>

              {/* Edit Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 mr-2 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  setIsEditing(true);
                  e.stopPropagation();
                }}
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </div>

            {isActive && (
              <div className="mt-2 w-full animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="grid grid-cols-[80px_1fr] place-self-center gap-x-2 gap-y-1 py-1">
                  {/* IP Row */}
                  <span className="text-xs text-end">IPv4 Address</span>
                  <span className="text-xs text-foreground truncate w-fit">
                    {master_device?.active_ip_configuration?.ip_addresses
                      ?.map((address) => `${address.address}/${address.prefix}`)
                      .join(", ")}
                  </span>

                  {/* Gateway Row */}
                  <span className="text-xs text-end">Default Route</span>
                  <span className="text-xs text-foreground truncate w-fit">
                    {master_device?.active_ip_configuration?.gateway || "-"}
                  </span>

                  {/* DNS Row */}
                  <span className="text-xs text-end">DNS</span>
                  <span className="text-xs text-foreground truncate w-fit">
                    {master_device?.active_ip_configuration?.dns?.join(",") ||
                      "-"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </li>
    </>
  );
}

function WiredDevice({
  wired_device,
  profiles,
}: {
  wired_device: WiredDeviceModel;
  profiles: { [key: string]: ConnectionProfileModel };
}) {
  console.log(profiles);

  return (
    <Accordion
      type="single"
      defaultValue={wired_device.is_active ? "followers" : ""}
      collapsible
    >
      <AccordionItem value="followers">
        <AccordionTrigger className="text-sm font-semibold">
          {wired_device.interface}: {DeviceStateLookup[wired_device.state]}
        </AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-4">
            {wired_device.available_profiles.map((path) => {
              return (
                <ConnectionProfile
                  profile={profiles[path]}
                  isActive={path == wired_device.active_profile_id}
                  master_device={wired_device}
                  onSelect={() => {
                    API_CLIENT.POST("/api/network/wired/activate_profile", {
                      params: {
                        query: {
                          interface: wired_device.interface,
                          profile_path: path,
                        },
                      },
                    });
                  }}
                />
              );
            })}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default function WiredConfig() {
  const [devices, setDevices] = useState([] as WiredDeviceModel[]);

  const { connected, socket } = useContext(WebsocketContext)!;

  const refresh_interface = () => {
    API_CLIENT.GET("/api/network/wired/devices").then((result) => {
      const devicesData = result.data!;
      API_CLIENT.GET("/api/network/connection_profiles").then(({ data }) => {
        const profileMap = data?.reduce(
          (acc, profile) => {
            acc[profile.path] = profile;
            return acc;
          },
          {} as Record<string, ConnectionProfileModel>,
        );

        console.log(profileMap);

        if (profileMap) setProfiles(profileMap);
        setDevices(devicesData);
      });
    });
  };

  useEffect(() => {
    if (connected) {
      socket?.on("refresh_wired_config", refresh_interface);
    }
  }, [connected, socket]);

  const [profiles, setProfiles] = useState<{
    [key: string]: ConnectionProfileModel;
  }>({});

  useEffect(() => {
    refresh_interface();
  }, []);

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Wired Configuration</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-4">
          {devices.map((dev) => (
            <WiredDevice wired_device={dev} profiles={profiles} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
