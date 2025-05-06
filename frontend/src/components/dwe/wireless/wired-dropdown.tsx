import { Network } from "lucide-react"; // Added Settings and Save icons
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { API_CLIENT } from "@/api";
import { components } from "@/schemas/dwe_os_2"; // Assuming your schema is at this path
import WebsocketContext from "@/contexts/WebsocketContext";
import { useToast } from "@/hooks/use-toast";
import { useContext, useEffect, useState } from "react";

// Import Shadcn UI components for form elements
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Import types from the generated schema
type IPConfiguration = components["schemas"]["IPConfiguration"];
type IPType = components["schemas"]["IPType"];

export function WiredDropdown() {
  const { connected, socket } = useContext(WebsocketContext)!;

  // State for the current IP configuration fetched from the API
  const [ipConfiguration, setIpConfiguration] = useState<
    IPConfiguration | undefined
  >(undefined);

  // State for the form inputs - initially null or empty
  const [formIpType, setFormIpType] = useState<IPType | null>(null);
  const [formStaticIp, setFormStaticIp] = useState<string>("");
  const [formPrefix, setFormPrefix] = useState<number | null>(null);
  const [formGateway, setFormGateway] = useState<string>("");
  const [formDns, setFormDns] = useState<string>(""); // Stored as comma-separated string

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // State for saving process
  const { toast } = useToast();

  // Function to fetch the current IP configuration
  const updateIPConfiguration = async () => {
    setIsLoading(true);
    try {
      const response: {
        data?: IPConfiguration | null;
        error?: any;
      } = await API_CLIENT.GET("/wired/get_ip_configuration");

      if (response.error) {
        console.error("Error fetching IP configuration:", response.error);
        setIpConfiguration(undefined);
        // Don't toast here if it's just 'no ethernet', toast on initial connection
      } else if (response.data) {
        setIpConfiguration(response.data);
        // Initialize form states when configuration is fetched
        setFormIpType(response.data.ip_type);
        setFormStaticIp(response.data.static_ip || "");
        setFormPrefix(response.data.prefix ?? 24); // Use ?? to default if null/undefined
        setFormGateway(response.data.gateway || "");
        setFormDns(response.data.dns ? response.data.dns.join(", ") : "");
      } else {
        setIpConfiguration(undefined);
        // Reset form states when no configuration is found
        setFormIpType(null);
        setFormStaticIp("");
        setFormPrefix(null);
        setFormGateway("");
        setFormDns("");
        toast({
          // Toast on initial load if no ethernet is found
          title: "Wired Network",
          description: "No wired network detected.",
          variant: "default",
        });
      }
    } catch (e) {
      console.error("API call error:", e);
      setIpConfiguration(undefined);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching IP config.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle saving the form
  const handleSaveConfiguration = async () => {
    if (!formIpType) {
      toast({
        title: "Validation Error",
        description: "Please select an IP type.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const payload: IPConfiguration = {
      ip_type: formIpType,
      static_ip: formIpType === "STATIC" ? formStaticIp || null : null, // Only include if STATIC
      prefix: formIpType === "STATIC" ? formPrefix ?? null : null, // Only include if STATIC
      gateway: formIpType === "STATIC" ? formGateway || null : null, // Only include if STATIC
      dns: formDns
        ? formDns
            .split(",")
            .map((d) => d.trim())
            .filter((d) => d !== "") // Split, trim, remove empty
        : null, // Send null if empty string
    };

    // Optional: Basic validation before sending
    if (payload.ip_type === "STATIC") {
      if (!payload.static_ip || !payload.prefix || !payload.gateway) {
        toast({
          title: "Validation Error",
          description:
            "IP Address, Prefix, and Gateway are required for Static IP.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
      // Add more robust IP address/prefix validation here if needed
    }

    try {
      // Correctly type the response for the POST
      const response: {
        data?: any; // Adjust type based on actual success response body
        error?: any;
      } = await API_CLIENT.POST("/wired/set_ip_configuration", {
        body: payload,
      });

      if (response.error) {
        console.error("Error saving IP configuration:", response.error);
        toast({
          title: "Error",
          description: `Failed to save wired IP configuration: ${
            response.error.message || "Unknown error"
          }.`,
          variant: "destructive",
        });
        // Re-fetch the configuration to show the current state if saving failed
        updateIPConfiguration();
      } else {
        toast({
          title: "Success",
          description: "Wired IP configuration saved.",
          variant: "default",
        });
        // Re-fetch the configuration to show the new state after saving
        updateIPConfiguration();
      }
    } catch (e) {
      console.error("API call error:", e);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving IP config.",
        variant: "destructive",
      });
      // Re-fetch on unexpected error as well
      updateIPConfiguration();
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (connected) {
      socket?.on("ip_changed", () => updateIPConfiguration());
      updateIPConfiguration();
    } else {
      // Clear configuration and reset form states when disconnected
      setIpConfiguration(undefined);
      setFormIpType(null);
      setFormStaticIp("");
      setFormPrefix(null);
      setFormGateway("");
      setFormDns("");
    }
  }, [connected]);

  // Sync form state when ipConfiguration changes (e.g., after fetching or saving)
  useEffect(() => {
    if (ipConfiguration) {
      setFormIpType(ipConfiguration.ip_type);
      setFormStaticIp(ipConfiguration.static_ip || "");
      setFormPrefix(ipConfiguration.prefix ?? 24);
      setFormGateway(ipConfiguration.gateway || "");
      setFormDns(ipConfiguration.dns ? ipConfiguration.dns.join(", ") : "");
    } else {
      // If ipConfiguration becomes undefined, reset form states
      setFormIpType(null);
      setFormStaticIp("");
      setFormPrefix(null);
      setFormGateway("");
      setFormDns("");
    }
  }, [ipConfiguration]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            {connected ? (
              <Network className="h-5 w-5 text-green-500" />
            ) : (
              <Network className="h-5 w-5 text-muted-foreground" />
            )}
            {isLoading || isSaving ? (
              <span className="absolute top-0 right-0 block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-blue-600" />
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-60 max-h-[400px] overflow-y-auto p-4" // Added p-4 for inner padding, increased max-height
        >
          <DropdownMenuLabel>Wired Network</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Display loading or "No ethernet" message if no config is available */}
          {isLoading && !ipConfiguration ? ( // Show loading only if no config is loaded yet
            <div className="px-4 py-2 text-sm text-center text-muted-foreground">
              Loading configuration...
            </div>
          ) : !ipConfiguration ? ( // Show no ethernet message if not loading and no config
            <div className="px-4 py-2 text-sm text-center text-muted-foreground">
              No wired network detected.
            </div>
          ) : (
            // Show the configuration form
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="ip-type">IP Configuration Type</Label>
                {/* Use RadioGroup for IP type selection */}
                <RadioGroup
                  id="ip-type"
                  value={formIpType || undefined} // RadioGroup expects string or undefined
                  onValueChange={(value: string) =>
                    setFormIpType(value as IPType)
                  }
                  className="flex space-x-4" // Layout radio buttons horizontally
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="DYNAMIC" id="dynamic" />
                    <Label htmlFor="dynamic">DHCP (Dynamic)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="STATIC" id="static" />
                    <Label htmlFor="static">Static</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Static IP fields - only visible if STATIC is selected */}
              {formIpType === "STATIC" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="static-ip">IP Address</Label>
                    <Input
                      id="static-ip"
                      value={formStaticIp}
                      onChange={(e) => setFormStaticIp(e.target.value)}
                      placeholder="e.g., 192.168.1.100"
                      type="text" // Use text for now, consider specific IP input mask later
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prefix">Prefix (Netmask)</Label>
                    <Input
                      id="prefix"
                      value={formPrefix ?? ""} // Handle null/undefined for input
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setFormPrefix(isNaN(val) ? null : val); // Store as number or null
                      }}
                      placeholder="e.g., 24"
                      type="number"
                      min={0}
                      max={32}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gateway">Gateway</Label>
                    <Input
                      id="gateway"
                      value={formGateway}
                      onChange={(e) => setFormGateway(e.target.value)}
                      placeholder="e.g., 192.168.1.1"
                      type="text"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dns">DNS Servers (comma-separated)</Label>
                    <Input
                      id="dns"
                      value={formDns}
                      onChange={(e) => setFormDns(e.target.value)}
                      placeholder="e.g., 8.8.8.8, 8.8.4.4"
                      type="text"
                    />
                  </div>
                </>
              )}

              {/* Save button */}
              <Button
                onClick={handleSaveConfiguration}
                disabled={isLoading || isSaving || !formIpType} // Disable if loading, saving, or no type selected
              >
                {isSaving && (
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-blue-600" />
                )}
                Save Changes
              </Button>

              {/* Display Current IP Configuration (Optional, for comparison) */}
              {/* You could show the currently applied config below the form */}
              {/* <DropdownMenuSeparator />
                <DropdownMenuLabel>Current Applied Config</DropdownMenuLabel>
                 <div className="text-xs px-4 py-2 text-muted-foreground">
                     ... display ipConfiguration here ...
                 </div>
                 */}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
