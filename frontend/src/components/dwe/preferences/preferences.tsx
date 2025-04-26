import { API_CLIENT } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import WebsocketContext from "@/contexts/WebsocketContext";
import { cn } from "@/lib/utils";
import { components } from "@/schemas/dwe_os_2";
import { useContext, useEffect, useState } from "react";

export const IP_REGEX =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)+([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$/;

const SettingsCard = ({
  cardTitle,
  children,
}: {
  cardTitle: string;
  children: React.ReactNode;
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
};

const PreferencesLayout = () => {
  const { connected } = useContext(WebsocketContext)!;

  const [host, setHost] = useState("");
  const [port, setPort] = useState(5600);

  const [recommendHost, setRecommendHost] = useState(false);

  useEffect(() => {
    const getSavedPreferences = async () => {
      const newPreferences = (await API_CLIENT.GET("/preferences")).data!;

      if (newPreferences.suggest_host) {
        newPreferences.default_stream!.host = (
          await API_CLIENT.GET("/preferences/get_recommended_host")
        ).data!["host"] as string;
      }

      setRecommendHost(newPreferences.suggest_host);
      setPort(newPreferences.default_stream!.port);
      setHost(newPreferences.default_stream!.host);
    };

    if (connected) {
      getSavedPreferences();
    }
  }, [connected]);

  const savePreferences = async (
    preferences: components["schemas"]["SavedPreferencesModel"]
  ) => {
    return await API_CLIENT.POST("/preferences/save_preferences", {
      body: preferences,
    });
  };

  const updateHost = async () => {
    setHost(
      (await API_CLIENT.GET("/preferences/get_recommended_host")).data![
        "host"
      ] as string
    );
  };

  useEffect(() => {
    if (connected && host && port && recommendHost !== undefined) {
      if (!IP_REGEX.test(host) || port < 1024 || port > 65535) {
        return;
      }
      if (recommendHost) {
        updateHost();
      }
      savePreferences({
        suggest_host: recommendHost,
        default_stream: { host, port },
      });
    }
  }, [recommendHost, host, port]);

  return (
    <div className="flex flex-wrap justify-start px-12 gap-8">
      <SettingsCard cardTitle="Stream">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="stream-host">Default Stream Host</Label>
            <Input
              id="stream-host"
              disabled={recommendHost}
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="Enter host IP"
              className={cn(!IP_REGEX.test(host) && "border-red-500")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="stream-port">Default Stream Port</Label>
            <Input
              id="stream-port"
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value))}
              placeholder="Enter port"
              min={1024}
              max={65535}
              className={cn((port < 1024 || port > 65535) && "border-red-500")}
            />
          </div>

          <Separator />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="recommend-host"
              checked={recommendHost}
              onCheckedChange={(checked) => setRecommendHost(!!checked)}
            />
            <Label htmlFor="recommend-host">Recommend Default Host</Label>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
};

export default PreferencesLayout;
