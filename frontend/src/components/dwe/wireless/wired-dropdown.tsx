import { Network } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { API_CLIENT } from "@/api";
import { components } from "@/schemas/dwe_os_2";
import WebsocketContext from "@/contexts/WebsocketContext";
import { useToast } from "@/hooks/use-toast";
import { useContext, useEffect, useState } from "react";

export function WiredDropdown() {
  const { toast } = useToast();
  const { connected, socket } = useContext(WebsocketContext)!;

  const [ipConfiguration, setIpConfiguration] = useState<
    components["schemas"]["IPConfiguration"] | undefined
  >(undefined);

  const [isWiredEnabled, setIsWiredEnabled] = useState(true);

  const updateIPConfiguration = async () => {
    setIpConfiguration(
      (await API_CLIENT.GET("/wired/get_ip_configuration")).data
    );
  };

  useEffect(() => {
    if (connected) {
      updateIPConfiguration();
    }

    return () => {};
  }, [connected]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            {isWiredEnabled ? (
              <Network className="h-5 w-5" />
            ) : (
              <Network className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 max-h-64 overflow-y-auto"
        >
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Wired Config</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsWiredEnabled(!isWiredEnabled)}
              className="h-7 text-xs"
            >
              {isWiredEnabled ? "Turn Off" : "Turn On"}
            </Button>
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
