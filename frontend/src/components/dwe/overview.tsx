// pages/index.tsx
import { Markdown } from "./markdown";

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
`;

export default function OverviewMarkdown() {
  return <Markdown>{markdown}</Markdown>;
}
