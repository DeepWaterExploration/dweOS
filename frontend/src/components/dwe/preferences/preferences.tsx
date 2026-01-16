import { API_CLIENT } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import WebsocketContext from "@/contexts/WebsocketContext";
import { cn } from "@/lib/utils";
import { components } from "@/schemas/dwe_os_2";
import { useContext, useEffect, useState } from "react";
import NotConnected from "../not-connected";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";
import { Button } from "@/components/ui/button";
import { useTour } from "@/components/tour/tour";

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
  const tour = useTour();

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

  const resetTour = () => {
    tour.setIsTourCompleted(false);
    tour.startTour();
    window.location.href = "/";
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
    <div
      className="flex flex-col gap-4 h-full w-full"
      id={TOUR_STEP_IDS.PREFS_PAGE}
    >
      <div
        className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(350px,1fr))]"
        id={TOUR_STEP_IDS.DEFAULT_STREAM_PREFS}
      >
        {connected ? (
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
                  className={cn(
                    !IP_REGEX.test(host) && "border-red-500",
                    "bg-background"
                  )}
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
                  className={cn(
                    (port < 1024 || port > 65535) && "border-red-500",
                    "bg-background"
                  )}
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
        ) : (
          <NotConnected />
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-bold pb-2">
              Guided Tour{" "}
              <div className="text-sm text-muted-foreground font-normal">
                Restart the DWE OS guided tour. This will refresh the
                application.
              </div>
            </CardTitle>
            <Button onClick={resetTour}>Reset</Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

export default PreferencesLayout;
