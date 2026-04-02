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

type WiredDeviceModel = components["schemas"]["WiredDeviceModel"];

type ConnectionProfileModel = components["schemas"]["ConnectionProfileModel"];

type IPV4Configuration = components["schemas"]["IPV4Configuration"];
type IPV4Address = components["schemas"]["IPV4Address"];

function AddressEdit({
  address,
  prefix,
  onUpdate,
}: {
  address?: string;
  prefix?: number;
  key: string;
  onUpdate: (address: string, prefix: number) => void;
}) {
  return (
    <TableRow>
      <TableCell>
        <Input value={address} className="h-8" onChange={(e) => {}} />
      </TableCell>
      <TableCell>
        <Input value={prefix} className="h-8" onChange={(e) => {}} />
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
  const config = profile?.ipv4_settings;

  const [method, setMethod] = useState(config?.method || "auto");
  const [ipAddresses, setIpAddresses] = useState(config?.ip_addresses || []);
  const [gateway, setGateway] = useState(config?.gateway || "");
  const [dns, setDns] = useState(config?.dns?.join(", ") || "");

  useEffect(() => {
    if (isOpen && config) {
      setMethod(config.method);
      setIpAddresses(config.ip_addresses || []);
      setGateway(config.gateway || "");
      setDns(config.dns?.join(", ") || "");
    }
  }, [isOpen, config]);

  const handleSave = () => {
    const updatedConfig: IPV4Configuration = {
      method: method as components["schemas"]["IPV4Method"],
      ip_addresses: method === "manual" && ipAddresses ? ipAddresses : [],
      gateway: method === "manual" ? gateway : "",
      dns:
        method === "manual" && dns ? dns.split(",").map((d) => d.trim()) : [],
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
                        onUpdate={() => {}}
                      />
                    ))}
                    <AddressEdit key="blank" onUpdate={() => {}} />
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
            </div>
          )}

          {/* Shared settings */}
          <div className="pt-4 border-t space-y-3">
            <Label>Routing Preferences</Label>
            <div className="flex items-start space-x-3 space-y-0 p-2">
              <Checkbox id="use-internet" />
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

  const onSave = () => {};

  return (
    <li
      className={cn(
        "flex items-center space-x-3 pt-3 pb-3 relative rounded-md border transition-all cursor-pointer",
        isActive
          ? "bg-accent/50 border-primary/50 shadow-sm" // Active styling
          : "bg-background border-transparent hover:bg-accent/30", // Inactive hover styling
      )}
      onClick={onSelect}
    >
      <EditProfileDialog
        device={master_device}
        isOpen={isEditing}
        setIsOpen={setIsEditing}
        onSave={onSave}
        profile={profile}
      />

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
    >
      <AccordionItem value="followers">
        <AccordionTrigger className="text-sm font-semibold">
          {wired_device.interface}
        </AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-4">
            {wired_device.available_profiles.map((path) => {
              console.log(path, wired_device);
              return (
                <ConnectionProfile
                  profile={profiles[path]}
                  isActive={path == wired_device.active_profile_id}
                  master_device={wired_device}
                  onSelect={() => {
                    if (wired_device.active_profile_id == path) return;
                    console.log(
                      `${wired_device.interface} Activiating connection: "${profiles[path].id}"`,
                    );
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
    <Card className="w-full">
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
