import { CameraCard } from "./dwe/cameras/camera-card";
import { Card, CardContent, CardHeader } from "./ui/card";

const testCameras = [
  {
    deviceId: "exploreHD USB Camera: exploreHD",
    manufacturer: "DWE.ai",
    usbId: "usb-000001:0-1.2",
    resolution: "1920x1080",
    fps: 30,
    format: "H.264",
    endpoints: ["192.168.1.198", "192.168.1.199"],
  },
];

const DeviceListLayout = () => {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-lg">Device List</h3>
      </CardHeader>
      <CardContent>
        {testCameras.map((cam) => (
          <CameraCard key={cam.deviceId} camera={cam} />
        ))}
      </CardContent>
    </Card>
  );
};

export default DeviceListLayout;
