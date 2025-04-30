import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

const NotConnected = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connection lost</CardTitle>
          <CardDescription>
            Please make sure DWE OS is accessible by this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <section className="space-y-4">
            <h3 className="font-semibold text-lg">Potential Issues</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Network Setup: </strong> Your network setup may have
                lost connection.
              </li>
            </ul>
          </section>
        </CardContent>
        <CardFooter>
          For more detailed documentation, refer to our docs.
        </CardFooter>
      </Card>
    </div>
  );
};

export default NotConnected;
