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

      return () => {
        socket?.off("connection_changed");
      };
    }

    return () => {};
  }, [connected]);

  const toggleWifi = () => {
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
              {networks.map((network) => (
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
              <DialogTitle>Connect to {wifiStatus?.connection?.id}</DialogTitle>
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
  return (
    <div className="flex h-4 items-end gap-[2px]">
      {[1, 2, 3, 4].map((level) => (
        <div
          key={level}
          className={cn(
            "w-1 bg-current rounded-sm",
            level <= strength ? "text-foreground" : "text-muted-foreground/30",
            {
              "h-1": level === 1,
              "h-2": level === 2,
              "h-3": level === 3,
              "h-4": level === 4,
            }
          )}
        />
      ))}
    </div>
  );
}
