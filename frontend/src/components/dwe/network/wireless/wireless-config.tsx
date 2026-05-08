import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WifiOff } from "lucide-react";

export default function WirelessConfig() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Wireless Network</CardTitle>
        <CardDescription>
          Manage Wi-Fi interfaces and connection profiles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/20 px-4 py-8 text-center">
          <WifiOff className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">
            Wi-Fi is not currently supported
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
