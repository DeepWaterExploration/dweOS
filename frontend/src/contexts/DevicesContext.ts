import React from "react";
import type { components } from "@/schemas/dwe_os_2";

type DeviceModel = components["schemas"]["DeviceModel"];

// Relative global State
const DevicesContext = React.createContext<
  | {
      devices: DeviceModel[];
      followerModels: DeviceModel[];
    }
  | undefined
>(undefined);

export default DevicesContext;
