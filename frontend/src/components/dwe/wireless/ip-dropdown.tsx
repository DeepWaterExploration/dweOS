import { API_CLIENT } from "@/api";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { components } from "@/schemas/dwe_os_2";
import { ChevronsLeftRightEllipsis } from "lucide-react";
import { useEffect, useState } from "react";

type IPListConfig = components["schemas"]["IPListConfig"];

export default function IPDropdown() {
    const [ips, setIPs] = useState<IPListConfig[]>([]);
    const fetchIPs = async () => {
        try {
            const response = await API_CLIENT.GET("/wifi/ip_addresses");
            const data = await response.data! as IPListConfig[];
            data.sort((a, b) => a.device_name.localeCompare(b.device_name));
            setIPs(data);
        } catch (error) {
            console.error("Error fetching IP addresses:", error);
        }
    };
    useEffect(() => {
        fetchIPs();
    }, []);
    return <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
                <ChevronsLeftRightEllipsis className="h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
            align="end"
            className="w-60 max-h-[400px] overflow-y-auto p-4" // Added p-4 for inner padding, increased max-height
        >
            {ips.map((ip) => (
                <div key={ip.ip_address} className="py-1">
                    {ip.ip_address}
                    <span className="text-xs text-muted-foreground">({ip.device_name})</span>
                </div>
            ))}
        </DropdownMenuContent>
    </DropdownMenu>
}
