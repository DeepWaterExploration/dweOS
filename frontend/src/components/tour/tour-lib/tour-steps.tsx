import { useMemo } from "react";

import { TourSegment } from "@/components/tour/tour-context";
import { TOUR_STEP_IDS } from "@/components/tour/tour-lib/tour-constants";
import { Separator } from "@/components/ui/separator";
import {
  CirclePower,
  Download,
  MouseLeft,
  MouseRight,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

export function useTourSteps(): Record<string, TourSegment> {
  return useMemo(() => {
    return {
      "/": {
        startStepId: TOUR_STEP_IDS.POWER_SWITCH,
        steps: {
          [TOUR_STEP_IDS.POWER_SWITCH]: {
            route: "/",
            position: "bottom",
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Power</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2 flex flex-col gap-2">
                  This controls the system's power setting.
                  <ul className="space-y-2">
                    <li>
                      <RefreshCw className="inline-block align-middle size-4 text-primary" />{" "}
                      <b>Restart</b> - Reboot your system.
                    </li>
                    <li>
                      <CirclePower className="inline-block align-middle size-4 text-primary" />{" "}
                      <b>Shutdown</b> - Turn off your system.
                    </li>
                  </ul>
                </div>
              </div>
            ),
            nextStepId: TOUR_STEP_IDS.HELP_SWITCH,
          },

          [TOUR_STEP_IDS.HELP_SWITCH]: {
            route: "/",
            position: "bottom",
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Help</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  Provides resources for setup as well as quick navigation (end
                  tour to navigate).
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.POWER_SWITCH,
            nextStepId: TOUR_STEP_IDS.TOUR_PAGE_BTN,
          },

          [TOUR_STEP_IDS.TOUR_PAGE_BTN]: {
            route: "/",
            position: "bottom",
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Tour Page</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  Run a tour for the current page.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.HELP_SWITCH,
            nextStepId: TOUR_STEP_IDS.MODE_TOGGLE,
          },

          [TOUR_STEP_IDS.MODE_TOGGLE]: {
            route: "/",
            position: "bottom",
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Dark / Light Mode</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  Cycles between <em>Dark Mode</em>, <em>System Default</em>,
                  and <em>Light Mode</em>.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.TOUR_PAGE_BTN,
            nextStepId: TOUR_STEP_IDS.CAMERAS_PAGE,
          },
        },
      },
      "/cameras": {
        startStepId: TOUR_STEP_IDS.CAMERAS_PAGE,
        steps: {
          [TOUR_STEP_IDS.CAMERAS_PAGE]: {
            route: "/cameras",
            position: "left",
            disableScroll: true,
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Cameras</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  This is where all detected cameras will automatically show up.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.MODE_TOGGLE,
            nextStepId: TOUR_STEP_IDS.CAMERA_DEVICE,
          },
          [TOUR_STEP_IDS.CAMERA_DEVICE]: {
            route: "/cameras",
            position: "right",
            disableScroll: true,
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Camera Device</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  This is a detected camera. We will go over what each section
                  controls and how to set up a streaming endpoint.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.CAMERAS_PAGE,
            nextStepId: TOUR_STEP_IDS.DROPPED_FRAMES,
          },

          [TOUR_STEP_IDS.DROPPED_FRAMES]: {
            route: "/cameras",
            position: "right",
            disableScroll: true,
            highlightPadding: 8,
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Dropped Frames</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  You can keep track of how many frames are dropped during
                  streaming/recording here.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.CAMERA_DEVICE,
            nextStepId: TOUR_STEP_IDS.DEVICE_NAME,
          },

          [TOUR_STEP_IDS.DEVICE_NAME]: {
            route: "/cameras",
            position: "right",
            disableScroll: true,
            highlightPadding: 8,
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Device Nickname</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  You may give your device a name here by selecting{" "}
                  <Pencil className="inline-block align-middle size-4 text-primary" />{" "}
                  <b>Edit</b>.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.DROPPED_FRAMES,
            nextStepId: TOUR_STEP_IDS.DEVICE_SETTINGS,
          },

          [TOUR_STEP_IDS.DEVICE_SETTINGS]: {
            route: "/cameras",
            position: "right",
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Device Settings</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  This is where you'll find the specific controls to your camera
                  device's <em>System</em>, <em>Exposure</em>, and{" "}
                  <em>Image</em>.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.DEVICE_NAME,
            nextStepId: TOUR_STEP_IDS.SYSTEM_CONTROLS,
          },

          [TOUR_STEP_IDS.SYSTEM_CONTROLS]: {
            route: "/cameras",
            position: "right",
            popoverWidth: 400,
            content: (
              <div className="flex flex-col">
                <div className="font-semibold">System Controls</div>
                <Separator />
                <ul className="text-sm text-muted-foreground p-2 space-y-2">
                  <li>
                    <b>Bitrate</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      Determines the amount of data processed per second of
                      video. Higher values yield better video quality but
                      consume more network bandwidth.
                    </div>
                  </li>
                  <li>
                    <b>Group of Pictures</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      Sets the interval between key-frames (I-frames) in the
                      video stream. A higher value improves compression
                      efficiency, while a lower value can reduce latency and
                      improve stream stability over weak connections.
                    </div>
                  </li>
                  <li>
                    <b>Variable Bitrate</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      When enabled, the stream’s bitrate will dynamically adjust
                      based on the visual complexity of the scene (VBR), saving
                      bandwidth during static shots rather than pushing a
                      constant bitrate (CBR). In practice, it will use a bitrate
                      between 10mbps and 70mbps.
                    </div>
                  </li>
                </ul>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.DEVICE_SETTINGS,
            nextStepId: TOUR_STEP_IDS.ADVANCED_CONTROLS,
          },

          [TOUR_STEP_IDS.ADVANCED_CONTROLS]: {
            route: "/cameras",
            position: "right",
            popoverWidth: 400,
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Advanced Controls</div>
                <Separator />
                <ul className="text-sm text-muted-foreground p-2 space-y-2">
                  <li>
                    <b>JPEG Image Quality</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      Adjusts the compression level, greatest visual clarity
                      results in greatest file size and vice versa.
                    </div>
                  </li>
                  <li>
                    <b>Strobe Width</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      Defines the duration of the strobe light pulse, allowing
                      you to synchronize external lighting with the camera's
                      exposure.
                    </div>
                  </li>
                  <li>
                    <b>ISO</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      Controls the sensor's sensitivity to light. Higher values
                      brighten the image but may introduce noise.
                    </div>
                  </li>
                  <li>
                    <b>Exposure Time</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      Dictates how long the sensor is exposed to light per frame
                      to control brightness and motion blur.
                    </div>
                  </li>
                  <li>
                    <b>Auto Exposure</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      When enabled, the camera automatically calculates and
                      adjusts its exposure settings based on the surrounding
                      ambient light.
                    </div>
                  </li>
                </ul>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.SYSTEM_CONTROLS,
            nextStepId: TOUR_STEP_IDS.EXPOSURE_CONTROLS,
          },

          [TOUR_STEP_IDS.EXPOSURE_CONTROLS]: {
            route: "/cameras",
            position: "right",
            popoverWidth: 400,
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Exposure Controls</div>
                <Separator />
                <ul className="text-sm text-muted-foreground p-2 space-y-2">
                  <li>
                    <b>Gain</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      Artificially amplifies the video signal to increase
                      brightness in low-light scenarios.
                    </div>
                  </li>
                  <li>
                    <b>Backlight Compensation</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      Adjusts the exposure to properly illuminate darker
                      subjects that are positioned against a bright background,
                      preventing them from appearing as silhouettes.
                    </div>
                  </li>
                  <li>
                    <b>Auto Exposure</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      When enabled, the camera automatically calculates and
                      adjusts its exposure settings based on the surrounding
                      ambient light.
                    </div>
                  </li>
                  <li>
                    <b>Exposure Time, Absolute</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      Allows you to manually dictate the specific duration the
                      sensor is exposed to light per frame.
                    </div>
                  </li>
                  <li>
                    <b>Exposure, Dynamic Framerate</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      When toggled on, this allows the camera to automatically
                      lower its framerate in dark environments. This increases
                      the exposure time per frame, resulting in a brighter image
                      at the cost of video smoothness.
                    </div>
                  </li>
                </ul>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.ADVANCED_CONTROLS,
            nextStepId: TOUR_STEP_IDS.IMAGE_PROCESSING,
          },

          [TOUR_STEP_IDS.IMAGE_PROCESSING]: {
            route: "/cameras",
            position: "right",
            popoverWidth: 400,
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Image Processing</div>
                <Separator />
                <ul className="text-sm text-muted-foreground p-2 space-y-2">
                  <li>
                    <b>Brightness</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      Adjusts the overall lightness or darkness of the video
                      feed.
                    </div>
                  </li>
                  <li>
                    <b>Contrast</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      Modifies the difference between the lightest and darkest
                      areas of the image.
                    </div>
                  </li>
                  <li>
                    <b>Saturation</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      Controls the intensity and vividness of the colors.
                    </div>
                  </li>
                  <li>
                    <b>Hue</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      Shifts the overall color phase (tint) of the video.
                    </div>
                  </li>
                  <li>
                    <b>White Balance, Automatic</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      Toggles our proprietary auto white-balance algorithm
                      designed to optimize color accuracy and clarity for
                      underwater.
                    </div>
                  </li>
                  <li>
                    <b>Gamma</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      Adjusts the brightness of the mid-tones in the video
                      without severely affecting the extreme shadows or bright
                      highlights.
                    </div>
                  </li>
                  <li>
                    <b>White Balance Temperature</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      Adjusts the color temperature of the camera. Lower values
                      produce cooler (more blue) tones, while higher values
                      produce warmer (more orange) tones.
                    </div>
                  </li>
                  <li>
                    <b>Sharpness</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      Enhances edge detail to make the image appear crisper and
                      more defined.
                    </div>
                  </li>
                  <li>
                    <b>Power Line Frequency</b>
                    <div className="border-l border-primary pl-2 ml-2 text-xs">
                      Prevents video flickering caused by artificial lights. You
                      should set this to match your local region’s electrical
                      grid frequency (e.g., 60 Hz for North America, 50 Hz for
                      Europe/Asia).
                    </div>
                  </li>
                </ul>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.EXPOSURE_CONTROLS,
            nextStepId: TOUR_STEP_IDS.DEVICE_STREAM_CONFIG,
          },

          [TOUR_STEP_IDS.DEVICE_STREAM_CONFIG]: {
            route: "/cameras",
            position: "right",
            disableScroll: true,
            popoverWidth: 400,

            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Device Stream Configuration</div>
                <Separator />
                <div className="text-sm text-muted-foreground px-2 pb-2 flex flex-col gap-2">
                  The device stream configurations are here. You set
                  customizations for:
                  <ul className="space-y-2">
                    <li>
                      <b>Resolution</b>
                      <div className="border-l border-primary pl-2 ml-2 text-xs">
                        Sets the image dimensions and level of detail.
                      </div>
                    </li>
                    <li>
                      <b>Frame Rate</b>
                      <div className="border-l border-primary pl-2 ml-2 text-xs">
                        Determines the number of frames captured per second
                        (FPS) for video smoothness.
                      </div>
                    </li>
                    <li>
                      <b>Format</b>
                      <div className="border-l border-primary pl-2 ml-2 text-xs">
                        Selects the encoding standard used for the video stream.
                      </div>
                    </li>
                  </ul>
                  We will cover the Endpoints section in the next step.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.IMAGE_PROCESSING,
            nextStepId: TOUR_STEP_IDS.DEVICE_ENDPOINTS,
          },

          [TOUR_STEP_IDS.DEVICE_ENDPOINTS]: {
            route: "/cameras",
            position: "right",
            disableScroll: true,
            highlightPadding: 24,
            popoverWidth: 400,
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Device Endpoints</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2 flex flex-col gap-2">
                  <span>Here you specify your streaming endpoint.</span>
                  <span>
                    Click{" "}
                    <Plus className="inline-block align-middle size-6 rounded-full border p-1 text-primary" />{" "}
                    <b>Add Endpoint</b> to create an endpoint.
                  </span>
                  <span>
                    With an <b>Endpoint</b>, you can:
                  </span>
                  <ul className="border-l border-primary pl-2 ml-2 space-y-2">
                    <li>
                      <Pencil className="inline-block align-middle size-4 text-primary" />{" "}
                      <b>Edit</b> the <b>IP Address</b> or <b>Port</b>
                    </li>
                    <li>
                      <Trash2 className="inline-block align-middle size-4 text-primary" />{" "}
                      <b>Delete</b> the Endpoint
                    </li>
                  </ul>
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.DEVICE_STREAM_CONFIG,
            nextStepId: TOUR_STEP_IDS.DEVICE_FOLLOWERS,
          },

          [TOUR_STEP_IDS.DEVICE_FOLLOWERS]: {
            route: "/cameras",
            position: "top",
            disableScroll: true,
            popoverWidth: 400,
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Followers</div>
                <Separator />
                <ul className="text-sm text-muted-foreground p-2 flex flex-col gap-2">
                  <li>
                    Here, you can assign <em>Followers</em>.
                  </li>
                  <li>
                    If compatible cameras are detected, you can add them as{" "}
                    <em>Followers</em> by selecting them in the dropdown and
                    clicking <b>Add</b>.
                  </li>
                  <li>
                    Once added, the <em>Follower's</em> streaming and recording
                    will be controlled by the <em>Leader</em> it's assigned to.
                  </li>
                </ul>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.DEVICE_ENDPOINTS,
            nextStepId: TOUR_STEP_IDS.DEVICE_RESET,
          },

          [TOUR_STEP_IDS.DEVICE_RESET]: {
            route: "/cameras",
            position: "right",
            disableScroll: true,
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Reset Card</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2 flex flex-col gap-2">
                  Reset this device's controls to default settings.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.DEVICE_FOLLOWERS,
            nextStepId: TOUR_STEP_IDS.DEVICE_STREAM,
          },

          [TOUR_STEP_IDS.DEVICE_STREAM]: {
            route: "/cameras",
            position: "right",
            disableScroll: true,
            highlightPadding: 8,
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Stream</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2 flex flex-col gap-2">
                  <span>This is where you control your stream.</span>
                  <span>Please ensure your endpoints are correct.</span>
                  <span>
                    If this device is managed (<em>Follower</em>), this button
                    will be disabled.
                  </span>
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.DEVICE_RESET,
            nextStepId: TOUR_STEP_IDS.RECORDING_PAGE,
          },
        },
      },
      "/recordings": {
        startStepId: TOUR_STEP_IDS.RECORDING_PAGE,
        steps: {
          [TOUR_STEP_IDS.RECORDING_PAGE]: {
            route: "/recordings",
            position: "left",
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Recordings</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2 flex flex-col gap-2">
                  <span>
                    This is where you'll find all recordings done on the system
                    through DWE Products.
                  </span>
                  <em>Drag to select multiple files.</em>
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.DEVICE_STREAM,
            nextStepId: TOUR_STEP_IDS.RECORDING_ITEM,
          },

          [TOUR_STEP_IDS.RECORDING_ITEM]: {
            route: "/recordings",
            position: "bottom",
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Recording File</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2 flex flex-col gap-2">
                  <span>
                    <MouseRight className="inline-block align-middle size-4 text-primary" />{" "}
                    <b>Right-Click</b> a recording/selections to open an options
                    menu.
                  </span>
                  <span>
                    <MouseLeft className="inline-block align-middle size-4 text-primary" />
                    x2 <b>Double-Left-Click</b> to quickly <em>Play</em>{" "}
                    supported videos.
                  </span>
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.RECORDING_PAGE,
            nextStepId: TOUR_STEP_IDS.RECORDING_FOOTER,
          },

          [TOUR_STEP_IDS.RECORDING_FOOTER]: {
            route: "/recordings",
            position: "top",
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Recordings Footer</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  Down here you have additional details and controls.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.RECORDING_ITEM,
            nextStepId: TOUR_STEP_IDS.RECORDINGS_FUNCTIONS,
          },

          [TOUR_STEP_IDS.RECORDINGS_FUNCTIONS]: {
            route: "/recordings",
            position: "top",
            highlightPadding: 8,
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Recordings Functions</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2 flex flex-col gap-2">
                  Upon selecting at least one item, the following functions
                  become available to you:
                  <ul className="space-y-2">
                    <li>
                      <Download className="inline-block align-middle size-4 text-primary mb-1" />{" "}
                      <b>Download</b>{" "}
                      <div className="border-l border-primary pl-2 ml-2 text-xs">
                        Download the selected files onto the system.
                      </div>
                    </li>
                    <li>
                      <Trash2 className="inline-block align-middle size-4 text-primary mb-1" />{" "}
                      <b>Delete</b>
                      <div className="border-l border-primary pl-2 ml-2 text-xs">
                        Delete the selected files.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.RECORDING_FOOTER,
            nextStepId: TOUR_STEP_IDS.STORAGE_BAR,
          },

          [TOUR_STEP_IDS.STORAGE_BAR]: {
            route: "/recordings",
            position: "top",
            highlightPadding: 12,
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Storage</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  You can see how storage is allocated on your system with this
                  widget.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.RECORDINGS_FUNCTIONS,
            nextStepId: TOUR_STEP_IDS.NETWORKING_PAGE,
          },
        },
      },
      "/network": {
        startStepId: TOUR_STEP_IDS.NETWORKING_PAGE,
        steps: {
          [TOUR_STEP_IDS.NETWORKING_PAGE]: {
            route: "/network",
            position: "bottom",
            highlightPadding: 12,
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Network Management</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  Welcome to the Network page. From here, you can manage both
                  your wired and wireless device connections and route settings.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.STORAGE_BAR,
            nextStepId: TOUR_STEP_IDS.WIRED_CONFIG,
          },
          [TOUR_STEP_IDS.WIRED_CONFIG]: {
            route: "/network",
            position: "right",
            highlightPadding: 12,
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Wired Configuration</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  This section lists all detected wired network interfaces. You
                  can view their current state and manage their connection
                  profiles.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.NETWORKING_PAGE,
            nextStepId: TOUR_STEP_IDS.NETWORK_OPTION,
          },
          [TOUR_STEP_IDS.NETWORK_OPTION]: {
            route: "/network",
            position: "right",
            highlightPadding: 12,
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Interface Status & Profiles</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  Click on a network interface to expand it. You'll see its
                  current state (e.g., Connected, Disconnected) and all
                  available connection profiles.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.WIRED_CONFIG,
            nextStepId: TOUR_STEP_IDS.NETWORK_OPTION_SETTINGS,
          },
          [TOUR_STEP_IDS.NETWORK_OPTION_SETTINGS]: {
            route: "/network",
            position: "right",
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Edit Connection Profile</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2 flex flex-col gap-2">
                  <span>
                    Click the settings icon to modify a specific profile. You
                    can switch between DHCP and Static IP, assign custom DNS
                    servers, and change default routing preferences.
                  </span>
                  <em>
                    Note: Remember to click on the profile to apply your
                    changes.
                  </em>
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.NETWORK_OPTION,
            nextStepId: TOUR_STEP_IDS.WIRELESS_NETWORK,
          },
          [TOUR_STEP_IDS.WIRELESS_NETWORK]: {
            route: "/network",
            position: "left",
            highlightPadding: 12,
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Wireless Network</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  Currently, wireless is unsupported. If your device supports
                  Wi-Fi, you will be able to scan for networks and manage
                  wireless connections here in future updates.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.NETWORK_OPTION_SETTINGS,
            nextStepId: TOUR_STEP_IDS.PREFS_PAGE,
          },
        },
      },
      "/preferences": {
        startStepId: TOUR_STEP_IDS.PREFS_PAGE,
        steps: {
          [TOUR_STEP_IDS.PREFS_PAGE]: {
            route: "/preferences",
            position: "left",
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Preferences</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  All dweOS preferences can be found here. Any settings and
                  configurations of the app (not devices) will be here.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.RECORDING_FOOTER,
            nextStepId: TOUR_STEP_IDS.DEFAULT_STREAM_PREFS,
          },

          [TOUR_STEP_IDS.DEFAULT_STREAM_PREFS]: {
            route: "/preferences",
            position: "bottom",
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Default Stream Preferences</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  These fields determine what show up automatically when you add
                  an endpoint. The Default Stream Port will increment
                  automatically as you add new endpoints for the same Stream
                  Host.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.PREFS_PAGE,
            nextStepId: TOUR_STEP_IDS.RESET_TOUR,
          },
          [TOUR_STEP_IDS.RESET_TOUR]: {
            route: "/preferences",
            position: "bottom",
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Reset Tour</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  You may restart the app-wide tour guide here. Resetting{" "}
                  <b>WILL REFRESH</b> the application.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.DEFAULT_STREAM_PREFS,
            nextStepId: TOUR_STEP_IDS.LOGS_PAGE,
          },
        },
      },
      "/log-viewer": {
        startStepId: TOUR_STEP_IDS.LOGS_PAGE,
        steps: {
          [TOUR_STEP_IDS.LOGS_PAGE]: {
            route: "/log-viewer",
            position: "left",
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Logs</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  The Logs page displays debug logs from across the app. Have
                  these on hand when contacting support.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.RESET_TOUR,
            nextStepId: TOUR_STEP_IDS.DEBUG_LOG,
          },

          [TOUR_STEP_IDS.DEBUG_LOG]: {
            route: "/log-viewer",
            position: "bottom",
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Debug Log</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  You can{" "}
                  <MouseLeft className="inline-block align-middle size-4 text-primary" />
                  <b>left-click</b> into a log for a detailed view.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.LOGS_PAGE,
            nextStepId: TOUR_STEP_IDS.TERMINAL,
          },
        },
      },
      "/terminal": {
        startStepId: TOUR_STEP_IDS.TERMINAL,
        steps: {
          [TOUR_STEP_IDS.TERMINAL]: {
            route: "/terminal",
            position: "left",
            content: (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Terminal</div>
                <Separator />
                <div className="text-sm text-muted-foreground p-2">
                  An instance of your system's terminal is running here.
                </div>
              </div>
            ),
            prevStepId: TOUR_STEP_IDS.DEBUG_LOG,
          },
        },
      },
    };
  }, []);
}
