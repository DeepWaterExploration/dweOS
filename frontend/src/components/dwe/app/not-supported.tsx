import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoIcon } from "lucide-react";
import { ReactNode } from "react";

export default function FeatureNotSupported({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <InfoIcon className="h-5 w-5" />
            <CardTitle className="text-lg">Feature Not Supported</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm">
            This feature is currently unavailable in your current environment.
            {children}
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
