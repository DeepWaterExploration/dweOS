import { API_CLIENT } from "@/api";
import { useTour } from "@/components/tour/tour-context";
import { TOUR_STEP_IDS } from "@/components/tour/tour-lib/tour-constants";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RangeControl } from "@/components/ui/range-control";
import { Separator } from "@/components/ui/separator";
import FeaturesContext from "@/contexts/FeaturesContext";
import WebsocketContext from "@/contexts/WebsocketContext";
import { cn } from "@/lib/utils";
import { components } from "@/schemas/dwe_os_2";
import { useContext, useEffect, useState } from "react";
import NotConnected from "../not-connected";
import { SettingsCard } from "./settings-card";

export const IP_REGEX =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)+([A-Za-z]|[A-Za-z][A-Za-z0-9-]*[A-Za-z0-9])$/;

const PreferencesLayout = () => {
  const { connected } = useContext(WebsocketContext)!;
  const features = useContext(FeaturesContext);

  const [host, setHost] = useState("");
  const [port, setPort] = useState(5600);
  const [frequencyOffset, setFrequencyOffset] = useState(0);

  const [recommendHost, setRecommendHost] = useState(false);
  const { resetTour } = useTour();

  useEffect(() => {
    const getSavedPreferences = async () => {
      const newPreferences = (await API_CLIENT.GET("/api/preferences")).data!;

      if (newPreferences.suggest_host) {
        newPreferences.default_stream!.host = (
          await API_CLIENT.GET("/api/preferences/get_recommended_host")
        ).data!["host"] as string;
      }

      setRecommendHost(newPreferences.suggest_host);
      setPort(newPreferences.default_stream!.port);
      setHost(newPreferences.default_stream!.host);
      setFrequencyOffset(newPreferences.frequency_offset);
    };

    if (connected) {
      getSavedPreferences();
    }
  }, [connected]);

  const savePreferences = async (
    preferences: components["schemas"]["SavedPreferencesModel"],
  ) => {
    return await API_CLIENT.POST("/api/preferences/save_preferences", {
      body: preferences,
    });
  };

  const updateHost = async () => {
    setHost(
      (await API_CLIENT.GET("/api/preferences/get_recommended_host")).data![
        "host"
      ] as string,
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
        frequency_offset: frequencyOffset,
      });
    }
  }, [recommendHost, host, port, frequencyOffset, connected]);

  if (!connected) return <NotConnected />;

  return (
    <div
      className="flex flex-col gap-4 h-full w-full"
      data-tour-id={TOUR_STEP_IDS.PREFS_PAGE}
    >
      <div
        className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(350px,1fr))]"
        data-tour-id={TOUR_STEP_IDS.DEFAULT_STREAM_PREFS}
      >
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
                  "bg-background",
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
                  "bg-background",
                )}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recommend-host"
                checked={recommendHost}
                onCheckedChange={(checked) => setRecommendHost(!!checked)}
              />
              <Label htmlFor="recommend-host">Recommend Default Host</Label>
            </div>

            <Separator className="mt-5" />

            {/* Frequency Offset Slider */}
            {features?.serial && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <Label htmlFor="freq-offset">
                    Camera Frequency Offset Configuration
                  </Label>
                </div>

                <RangeControl
                  label="Frequency Offset (Hz)"
                  min={-1}
                  max={1}
                  step={0.001}
                  value={frequencyOffset}
                  onChange={(val) => setFrequencyOffset(val)}
                  className="py-2"
                />

                <p className="text-xs text-muted-foreground italic">
                  Adjust the fine-tuning offset for camera clock frequency. Use
                  if you are experiencing flickering or synchronization issues.
                </p>
              </div>
            )}
          </div>
        </SettingsCard>
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
