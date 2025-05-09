// pages/index.tsx
import { Markdown } from "@/components/markdown";

const markdown = `
# DWE OS Overview

DWE OS is an optional software designed to run on underwater systems, extending the functionality of DeepWater Exploration cameras.

## Key Features

- **Bus ID Camera Enumeration:** Ensures cameras retain their settings even after a reboot, eliminating port confusion.
- **StellarHD Leader/Follower Support:** Enables PrecisionSync™ to work seamlessly out of the box with DWE OS.
- **WiFi Configuration Interface:** Allows easy system updates directly from DWE OS.
- **Light Control Integration:** Provides control over the on/off state and brightness of lights.
- **Built-in Terminal:** Facilitates access to advanced features without the need for SSH.

For more detailed documentation, refer to the official project docs at [docs.dwe.ai](https://docs.dwe.ai/software/dwe-os/dwe-os-2).

## Branch Specific Features

**IMPORTANT**: This version of DWE OS is from a different branch, feature/usb-pwm.

It is meant to be used in specific environments where two devices are in follower mode, and must be synchronized together with an external clock.
Setting another follower device as a leader is officially supported in this branch, and will allow two followers to be synchronized. Changing the FPS of ANY connected camera will automatically change the frequency of the connected atmega processor.
`;

export default function OverviewMarkdown() {
  return <Markdown>{markdown}</Markdown>;
}
