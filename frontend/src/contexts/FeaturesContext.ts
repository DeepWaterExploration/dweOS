import React from "react";
import type { components } from "@/schemas/dwe_os_2";

type FeatureSupport = components["schemas"]["FeatureSupport"];

// Relative global State
const FeaturesContext = React.createContext<FeatureSupport | undefined>(
  undefined
);

export default FeaturesContext;
