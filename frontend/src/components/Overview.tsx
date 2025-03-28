import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const OverviewLayout = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>DWE OS Overview</CardTitle>
          <CardDescription>
            DWE OS is an optional software designed to run on underwater
            systems, extending the functionality of DeepWater Exploration
            cameras.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <section className="space-y-4">
            <h3 className="font-semibold text-lg">Key Features</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Bus ID Camera Enumeration:</strong> Ensures cameras
                retain their settings even after a reboot, eliminating port
                confusion.
              </li>
              <li>
                <strong>StellarHD Leader/Follower Support:</strong> Enables
                PrecisionSync™ to work seamlessly out of the box with DWE OS.
              </li>
              <li>
                <strong>WiFi Configuration Interface:</strong> Allows easy
                system updates directly from DWE OS.
              </li>
              <li>
                <strong>Light Control Integration:</strong> Provides control
                over the on/off state and brightness of lights.
              </li>
              <li>
                <strong>Built-in Terminal:</strong> Facilitates access to
                advanced features without the need for SSH.
              </li>
            </ul>
          </section>
        </CardContent>
        <CardFooter>
          For more detailed documentation, refer to the official project docs
          at&nbsp;
          <a
            href="https://docs.dwe.ai/software/dwe-os/dwe-os-2"
            className="text-blue-500 hover:underline"
          >
            docs.dwe.ai
          </a>
          .
        </CardFooter>
      </Card>
    </div>
  );
};

export default OverviewLayout;
