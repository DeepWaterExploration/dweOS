import { components } from "@/schemas/dwe_os_2";

type ControlModel = components["schemas"]["ControlModel"];
type ControlFlags = NonNullable<ControlModel["flags"]>;

const FPS_TO_MAX_EXPOSURE: Record<number, number> = {
  60: 1462,
  50: 1756,
  40: 2119,
  30: 2942,
  15: 5884,
  10: 5884,
  5: 5884,
};

// Typing stuff was AI assisted
type FlagsLambdaMap = {
  [K in keyof ControlFlags]?: (
    controls: ControlModel[],
    device: components["schemas"]["DeviceModel"],
  ) => ControlFlags[K];
};

type UiFlagsLambdaMap = (
  controls: ControlModel[],
  device: components["schemas"]["DeviceModel"],
) => boolean;

interface RuleConfiguration {
  uiFlags?: {
    disabled: UiFlagsLambdaMap;
  };
  flags?: FlagsLambdaMap;
}

const checkIfValue = (
  controls: ControlModel[],
  name: string,
  expected: boolean | number = true,
) => controls.find((c) => c.name === name)?.value === expected;

// The performance for this is not great, or even good
// it needs to loop over everything just to get one value which is horrendous
const DYNAMIC_RULES: Record<string, RuleConfiguration> = {
  "Strobe Width": {
    flags: {
      max_value: (controls) =>
        (controls.find((c) => c.name === "Shutter Speed")?.value as number) ??
        0,
    },
    uiFlags: {
      disabled: (controls) => checkIfValue(controls, "Auto Exposure (ASIC)"),
    },
  },
  ISO: {
    uiFlags: {
      disabled: (controls) => checkIfValue(controls, "Auto Exposure (ASIC)"),
    },
  },
  "Shutter Speed": {
    flags: {
      max_value: (_, device) => {
        const fps = device.stream.interval.denominator;
        return FPS_TO_MAX_EXPOSURE[fps] ?? 0;
      },
    },
    uiFlags: {
      disabled: (controls) => checkIfValue(controls, "Auto Exposure (ASIC)"),
    },
  },
  "White Balance Temperature": {
    uiFlags: {
      disabled: (controls) =>
        checkIfValue(controls, "White Balance, Automatic"),
    },
  },
  "Exposure Time, Absolute": {
    uiFlags: {
      disabled: (controls) => checkIfValue(controls, "Auto Exposure", 3),
    },
  },
};

export type UIControlModel = ControlModel & {
  uiFlags: {
    disabled: boolean;
  };
};

export const translateControls = (
  originalControls: ControlModel[],
  device: components["schemas"]["DeviceModel"],
): Record<string, UIControlModel> => {
  return Object.fromEntries(
    originalControls.map((originalControl) => {
      const rule = DYNAMIC_RULES[originalControl.name];

      if (!rule)
        return [
          originalControl.name,
          { ...originalControl, uiFlags: { disabled: false } },
        ];

      return [
        originalControl.name,
        {
          ...originalControl,
          uiFlags: {
            disabled: rule.uiFlags?.disabled
              ? rule.uiFlags?.disabled(originalControls, device)
              : false,
          },
          flags: rule.flags
            ? {
                ...originalControl.flags,
                ...Object.fromEntries(
                  Object.entries(rule.flags).map(([flagName, func]) => [
                    flagName,
                    func(originalControls, device),
                  ]),
                ),
              }
            : originalControl.flags,
        },
      ];
    }),
  );
};
