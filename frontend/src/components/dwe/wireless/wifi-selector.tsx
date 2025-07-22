import { useCallback, useContext, useEffect, useState } from "react";
import { Wifi, WifiOff, Check, Lock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { API_CLIENT } from "@/api";
import { components } from "@/schemas/dwe_os_2";
import WebsocketContext from "@/contexts/WebsocketContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function WifiSelector() {
  const { toast } = useToast();
  const { connected, socket } = useContext(WebsocketContext)!;

  const [networks, setNetworks] = useState(
    [] as components["schemas"]["AccessPoint"][]
  );
  const [isWifiEnabled, setIsWifiEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [password, setPassword] = useState<string | undefined>(undefined);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<
    components["schemas"]["AccessPoint"] | null
  >(null);

  const [wifiStatus, setWifiStatus] = useState<
    undefined | components["schemas"]["Status"]
  >(undefined);

  const updateWifiNetworks = async () => {
    const wifiNetworks = (await API_CLIENT.GET("/wifi/access_points")).data!;
    setNetworks(wifiNetworks);
  };

  const updateConnectedNetwork = async () => {
    setWifiStatus((await API_CLIENT.GET("/wifi/status")).data!);
  };

  useEffect(() => {
    if (connected) {
      updateConnectedNetwork();
      updateWifiNetworks();

      socket?.on("connection_changed", () => {
        updateConnectedNetwork();
      });

      socket?.on("aps_changed", () => {
        updateWifiNetworks();
      });

      return () => {
        socket?.off("connection_changed");
        socket?.off("aps_changed");
      };
    }

    return () => { };
  }, [connected]);

  const toggleWifi = async () => {
    await API_CLIENT.POST(isWifiEnabled ? "/wifi/off" : "/wifi/on");
    setIsWifiEnabled(!isWifiEnabled);
    if (isWifiEnabled) {
      // Disconnect from all networks when turning WiFi off

      setNetworks(
        networks.map((network) => ({ ...network, connected: false }))
      );
    }
  };

  const handleNetworkConnect = (
    network: components["schemas"]["AccessPoint"]
  ) => {
    if (network.requires_password) {
      setSelectedNetwork(network);
      setPassword("");
      setPasswordDialogOpen(true);
    } else {
      connectToNetwork(network.ssid);
    }
  };

  const connectToNetwork = async (ssid: string, password?: string) => {
    let result = (
      await API_CLIENT.POST("/wifi/connect", {
        body: { ssid: ssid, password: password },
      })
    ).data!.result;

    if (result) {
      toast({
        title: "WiFi Connected!",
        variant: "default",
      });
    } else {
      toast({
        title: "Uh Oh! WiFi Connected Failed!",
        variant: "destructive",
      });
    }
    setIsConnecting(false);
    setSelectedNetwork(null);
    setPassword(undefined);
    setPasswordDialogOpen(false);
  };

  const closePasswordDialog = useCallback(() => {
    console.log("closing");
    setPasswordDialogOpen(false);
    setSelectedNetwork(null);
    setPassword(undefined);
    setIsConnecting(false); // Ensure connecting state is reset
  }, []); // No dependencies needed

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNetwork) return;

    setIsConnecting(true);

    connectToNetwork(selectedNetwork.ssid, password);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            {isWifiEnabled ? (
              <Wifi className="h-5 w-5" />
            ) : (
              <WifiOff className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 max-h-64 overflow-y-auto"
        >
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>WiFi</span>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleWifi}
              className="h-7 text-xs"
            >
              {isWifiEnabled ? "Turn Off" : "Turn On"}
            </Button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {isWifiEnabled ? (
            <>
              {networks

                .sort((a, b) => {
                  const connectedId = wifiStatus?.connection?.id;
                  console.log(connectedId);

                  if (a.ssid === connectedId) return -1; // a is connected, put first
                  if (b.ssid === connectedId) return 1; // b is connected, put first
                  return b.strength - a.strength; // otherwise sort by strength
                })
                .filter(
                  (network, index) =>
                    networks.findIndex(
                      (findNetwork) => network.ssid === findNetwork.ssid
                    ) === index
                )
                .map((network) => (
                  <DropdownMenuItem
                    key={network.ssid}
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => handleNetworkConnect(network)}
                  >
                    <div className="flex items-center gap-2">
                      <SignalStrength strength={network.strength} />
                      <span className="truncate max-w-[8rem]">
                        {network.ssid}
                      </span>
                      {network.requires_password && (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    {wifiStatus?.connection?.id == network.ssid && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </DropdownMenuItem>
                ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span className="text-sm text-muted-foreground">
                  Add Network
                </span>
              </DropdownMenuItem>
            </>
          ) : (
            <div className="py-3 px-2 text-sm text-center text-muted-foreground">
              WiFi is turned off
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handlePasswordSubmit}>
            <DialogHeader>
              <DialogTitle>Connect to {selectedNetwork?.ssid}</DialogTitle>
              <DialogDescription>
                This network is password protected. Please enter the password to
                connect.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="col-span-3"
                  required
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isConnecting}>
                {isConnecting ? "Connecting..." : "Connect"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface SignalStrengthProps {
  strength: number; // 1-4, where 4 is the strongest
}

function SignalStrength({ strength }: SignalStrengthProps) {
  const thresholds = [20, 50, 70];

  const h_values = ["h-[0.25rem]", "h-2", "h-3", "h-4"];

  return (
    <div className="flex h-4 items-end gap-[2px]">
      {thresholds.map((threshold, index) => (
        <div
          key={threshold}
          className={cn(
            "w-1 rounded-sm",
            strength >= threshold ? "bg-foreground" : "bg-muted-foreground/30",
            `h-${index + 2}`
          )}
        />
      ))}
    </div>
  );
}
