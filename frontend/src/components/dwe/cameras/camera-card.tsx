import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"; // adjust the import path for your setup
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface CameraData {
  deviceId: string;
  manufacturer: string;
  usbId: string;
  resolution: string;
  fps: number;
  format: string;
  endpoints: string[];
}

interface CameraCardProps {
  camera: CameraData;
}

export function CameraCard({ camera }: CameraCardProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{camera.deviceId}</CardTitle>
        <CardDescription>
          Manufacturer: {camera.manufacturer}
          <br />
          USB Port ID: {camera.usbId}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
