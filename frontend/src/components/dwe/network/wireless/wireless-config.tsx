import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function WirelessConfig() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Wireless Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <section className="space-y-4">
            <h3 className="font-semibold text-lg">
              No supported wireless device found.
            </h3>
          </section>
        </CardContent>
        <CardFooter>
          For more detailed documentation, refer to our docs.
        </CardFooter>
      </Card>
    </div>
  );
}
