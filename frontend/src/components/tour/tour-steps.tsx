import { Separator } from "@/components/ui/separator";
import { TourStep } from "@/components/tour/tour";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";
import { components } from "@/schemas/dwe_os_2";
import Markdown from "react-markdown";

export function getSteps(
  features: components["schemas"]["FeatureSupport"]
): TourStep[] {
  return [
    {
      content: (
        <div>
          <div>Power</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            This controls the system's power setting, allowing you to turn off /
            restart the system from within DWE OS. This will restart your entire
            device!
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.POWER_SWITCH,
      route: "/",
      position: "bottom",
      onClickWithinArea: () => {},
    },
    ...(features.wifi
      ? [
          {
            content: (
              <div>
                <div>Wifi</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  This controls the system's wifi setting (should it exist).
                  Functionalities includes network selection and toggling.
                </div>
              </div>
            ),
            selectorId: TOUR_STEP_IDS.WIFI_SWITCH,
            route: "/",
            position: "bottom" as const,
            onClickWithinArea: () => {},
          },
          {
            content: (
              <div>
                <div>Wired Network</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  This controls the system's wired network configuration. Allows
                  for customization of options like: IP Address, Gateway,
                  Netmask etc.
                </div>
              </div>
            ),
            selectorId: TOUR_STEP_IDS.ETHERNET_SWITCH,
            route: "/",
            position: "bottom" as const,
            onClickWithinArea: () => {},
          },
        ]
      : []),

    {
      content: (
        <div>
          <div>Help</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            Provides resources for setup as well as quick navigation.
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.HELP_SWITCH,
      route: "/",
      position: "bottom",
      onClickWithinArea: () => {},
    },
    {
      content: (
        <div>
          <div>Dark / Light Mode</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            Toggles between Dark Mode, Light Mode, and System Default,
            influencing the color of the application
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.MODE_TOGGLE,
      route: "/",
      position: "bottom",
      onClickWithinArea: () => {},
    },
    {
      content: (
        <div>
          <div>Cameras</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            {" "}
            This is where all detected camera will automatically show up.
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.CAMERAS,
      route: "/cameras",
      position: "left",
      onClickWithinArea: () => {},
    },
    {
      content: (
        <div>
          <div>Camera Device</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            This is a detected camera. If there are none detected, a sample has
            been added for you.
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.DEMO_DEVICE,
      route: "/cameras",
      position: "right",
      onClickWithinArea: () => {},
    },
    {
      content: (
        <div>
          <div>Device Nickname</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            You may give your device a name here by selecting the pen icon.
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.DEVICE_NAME,
      route: "/cameras",
      position: "left",
      onClickWithinArea: () => {},
    },
    {
      content: (
        <div>
          <div>Device Stream Configuration</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            The device stream configurations are here. You set customizations
            for Resolution, Frame Rate, and Format here.
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.DEVICE_STREAM_CONFIG,
      route: "/cameras",
      position: "right",
      onClickWithinArea: () => {},
    },
    {
      content: (
        <div>
          <div>Device Endpoints</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            Here you specify your streaming endpoint, please have the system IP
            and port of the device you are streaming to on hand. The device you
            are accessing this page from will be automatically selected to
            start.
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.DEVICE_ENDPOINTS,
      route: "/cameras",
      position: "left",
      onClickWithinArea: () => {},
    },
    {
      content: (
        <div>
          <div>Add Endpoints</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            Select the plus button to add endpoints
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.ADD_ENDPOINTS,
      route: "/cameras",
      position: "right",
      onClickWithinArea: () => {},
    },
    {
      content: (
        <div>
          <div>Device Mode</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            This toggles between Recording and Streaming mode. Streaming will
            send the live stream to another device, while recording will keep
            recorded videos in the recordings tab.
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.DEVICE_MODE,
      route: "/cameras",
      position: "left",
      onClickWithinArea: () => {},
    },
    {
      content: (
        <div>
          <div>Device Settings</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            This is where you'll find the specific controls to your camera
            device's exposure, image, and system. Controls include: Gain,
            Brightness, Contrast, Gamma, etc.
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.DEVICE_SETTINGS,
      route: "/cameras",
      position: "right",
      onClickWithinArea: () => {},
    },
    {
      content: (
        <div>
          <div>Stream / Record</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            <Markdown>
              This is where you start/stop your stream or recording. For
              streaming, please ensure your endpoints are correct. The stream
              will **NOT** automatically start.
            </Markdown>
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.DEVICE_STREAM,
      route: "/cameras",
      position: "left",
      onClickWithinArea: () => {},
    },
    {
      content: (
        <div>
          <div>Recordings</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            This is where you'll find any recordings done through the previous
            tab's record functionality.
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.REC_PAGE,
      route: "/recordings",
      position: "left",
      onClickWithinArea: () => {},
    },
    {
      content: (
        <div>
          <div>Sample Recording</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            You can right click a recording to rename or delete, and left click
            for a detailed view as well as a video preview.
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.DEMO_RECORDING,
      route: "/recordings",
      position: "bottom",
      onClickWithinArea: () => {},
    },
    {
      content: (
        <div>
          <div>Recordings</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            Down here you have additional details and the ability to download
            all videos in a ZIP file.
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.RECORDING_FOOTER,
      route: "/recordings",
      position: "top",
      onClickWithinArea: () => {},
    },
    {
      content: (
        <div>
          <div>Preferences</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            You'll find application preferences here. Any settings and
            configurations of the app (not devices) will be here.
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.PREFS_PAGE,
      route: "/preferences",
      position: "left",
      onClickWithinArea: () => {},
    },
    {
      content: (
        <div>
          <div>Default Stream Preferences</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            These fields determine what show up automatically when you add an
            endpoint. The Default Stream Port will increment automatically as
            you add new endpoints for the same Stream Host.
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.DEFAULT_STREAM_PREFS,
      route: "/preferences",
      position: "bottom",
      onClickWithinArea: () => {},
    },
    {
      content: (
        <div>
          <div>Logs</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            This page will display anything pertaining to the devices, it will
            log occurances like device adding, device removal, device setting
            tweaks, etc. Have these on hand when contacting support.
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.LOGS_PAGE,
      route: "/log-viewer",
      position: "left",
      onClickWithinArea: () => {},
    },
    {
      content: (
        <div>
          <div>Sample Log</div>
          <Separator />
          <div className="text-sm text-muted-foreground p-2">
            You can left click into a log for a detailed view.
          </div>
        </div>
      ),
      selectorId: TOUR_STEP_IDS.DEMO_LOGS,
      route: "/log-viewer",
      position: "bottom",
      onClickWithinArea: () => {},
    },
    ...(features.ttyd
      ? [
          {
            content: (
              <div>
                <div>Terminal</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  A built in terminal for your convenience. You will be prompted
                  to input your username and password.
                </div>
              </div>
            ),
            selectorId: TOUR_STEP_IDS.TERMINAL,
            route: "/terminal",
            position: "left" as const,
            onClickWithinArea: () => {},
          },
        ]
      : []),
  ];
}
