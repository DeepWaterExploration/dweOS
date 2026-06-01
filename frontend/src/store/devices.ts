import { API_CLIENT } from "@/api";
import { components } from "@/schemas/dwe_os_2";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { subscribeWithSelector } from "zustand/middleware";
import { useCallback, useState } from "react";
import { getStreamFromStreamInfo } from "@/lib/util/device";

// TODO:
// I'd like to switch the behavior to one of the following:
// 1. Return all partial updates on return for every post request. Then we can update the state of all effected devices
// 2. Return affected bus_ids and add a GET for {bus_id}
// 3. State update via device updated:
//    a. Send the updated device
//    b. Same as 2, just send which devices are stale

export interface DeviceState {
  devices: Record<string, components["schemas"]["DeviceModel"]>;

  isStreamLoading: Record<string, boolean>;

  fetchDevices: () => Promise<void>;
  addDevice: (device: components["schemas"]["DeviceModel"]) => void;
  removeDevice: (id: string) => void;
  reset: () => void;

  configureStream: (
    bus_info: string,
    streamInfo: Partial<components["schemas"]["StreamInfoModel"]>,
  ) => Promise<boolean>;
  setNickname: (bus_info: string, nickname: string) => void;
  setUVCControl: (
    bus_info: string,
    control_id: number,
    value: number | boolean,
  ) => Promise<void>;
  addFollower: (leader_bus_info: string, follower_bus_info: string) => void;
  removeFollower: (leader_bus_info: string, follower_bus_info: string) => void;
}

export const useDeviceStore = create<DeviceState>()(
  subscribeWithSelector(
    immer((set, get, store) => ({
      isStreamLoading: {},
      devices: {},
      configureStream: async (
        bus_info: string,
        partialStreamInfo: Partial<components["schemas"]["StreamInfoModel"]>,
      ) => {
        const stream = get().devices[bus_info].stream;

        // The stream info we are sending in the API request
        const streamInfo: components["schemas"]["StreamInfoModel"] = {
          bus_info: bus_info,
          enabled: partialStreamInfo.enabled ?? stream.enabled,
          encode_type: partialStreamInfo.encode_type ?? stream.encode_type,
          endpoints: partialStreamInfo.endpoints ?? stream.endpoints,
          // FIXME: Why did I make the API for the sender different from what we receive...
          // For now I'll just be doing conversions here
          stream_format: partialStreamInfo.stream_format ?? {
            width: stream.width,
            height: stream.height,
            interval: stream.interval,
          },
          stream_type: partialStreamInfo.stream_type ?? stream.stream_type,
        };

        set((state) => {
          state.isStreamLoading[bus_info] = true;
        });

        const { data, error } = await API_CLIENT.POST(
          "/api/devices/configure_stream",
          {
            body: streamInfo,
            keepalive: false,
          },
        );

        let success = false;

        if (data) {
          // If successful...
          set((state) => {
            const device = state.devices[bus_info];

            // TODO: make it base this off of responseData which is not in the API yet
            if (device && device.stream) {
              device.stream = getStreamFromStreamInfo(
                device.stream,
                streamInfo,
              );
            }

            for (const follower_bus_info of device.followers) {
              const follower = state.devices[follower_bus_info];
              if (!follower) {
                console.error(
                  `Device follower: ${follower_bus_info} does not exist!`,
                );
                continue;
              }

              // FIXME:
              // This is another example of how we replicate state in the frontend that's created in the backend...
              follower.stream = {
                ...device.stream,
                enabled: false,
                device_path: follower.stream.device_path,
              };
            }
          });

          success = data.success;
        } else {
          // TODO: return this too
          console.error(error);
        }

        set((state) => {
          state.isStreamLoading[bus_info] = false;
        });

        return success;
      },
      addDevice: (device: components["schemas"]["DeviceModel"]) => {
        set((state) => {
          state.devices[device.bus_info] = device;
        });
      },
      removeDevice: (id: string) => {
        set((state) => {
          delete state.devices[id];
        });
      },
      reset: () => {
        set(store.getInitialState());
      },
      fetchDevices: async () => {
        const { data, error } = await API_CLIENT.GET("/api/devices/map");
        if (data) {
          set((state) => {
            state.devices = data;
          });
        } else {
          console.error(`Failed to load device list! ${error}`);
        }
      },
      setNickname: async (bus_info: string, nickname: string) => {
        const { data, error } = await API_CLIENT.POST(
          "/api/devices/set_nickname",
          { body: { bus_info, nickname } },
        );

        if (data) console.log(data);
        else if (error) console.error(error);
      },
      setUVCControl: async (
        bus_info: string,
        control_id: number,
        value: number | boolean,
      ) => {
        const { data, error } = await API_CLIENT.POST(
          "/api/devices/set_uvc_control",
          { body: { bus_info, control_id, value } },
        );

        if (data && data.success) {
          set((state) => {
            const device = state.devices[bus_info];
            // FIXME: slow
            for (let i = 0; i < device.controls.length; i++) {
              if (device.controls[i].control_id === control_id)
                device.controls[i].value = value;
            }

            device.followers.forEach((follower_bus_info) =>
              state.setUVCControl(follower_bus_info, control_id, value),
            );
          });
        } else {
          if (data && !data.success) {
            throw new Error("Unable to set UVC Control!");
          }
          if (error) {
            throw error;
          }

          throw new Error("Unknown error occurred!");
        }
      },
      addFollower: async (
        leader_bus_info: string,
        follower_bus_info: string,
      ) => {
        const { data, error } = await API_CLIENT.POST(
          "/api/devices/add_follower",
          {
            body: {
              leader_bus_info,
              follower_bus_info,
            },
          },
        );

        if (data) {
          console.log(data);

          // If successful
          // TODO: switch to either event updates or response updates
          set((state) => {
            state.devices[leader_bus_info].followers.push(follower_bus_info);

            state.devices[follower_bus_info].is_managed = true;
            state.devices[follower_bus_info].stream.enabled = false;
            state.devices[follower_bus_info].stream.endpoints = [];
          });
        } else if (error) {
          console.error(error);
        }
      },
      removeFollower: async (
        leader_bus_info: string,
        follower_bus_info: string,
      ) => {
        const { data, error } = await API_CLIENT.POST(
          "/api/devices/remove_follower",
          {
            body: {
              leader_bus_info,
              follower_bus_info,
            },
          },
        );

        if (data) {
          console.log(data);

          // If successful
          // TODO: switch to either event updates or response updates
          set((state) => {
            state.devices[leader_bus_info].followers = state.devices[
              leader_bus_info
            ].followers.filter((follower) => follower !== follower_bus_info);

            state.devices[follower_bus_info].is_managed = false;
          });
        } else if (error) {
          console.error(error);
        }
      },
    })),
  ),
);

// This function is interesting and may be removed for a better system, but it allows
// for all function calls for a given api request to have a shared loading state
// (see stream.tsx)
export function useDeviceAction<Props extends unknown[]>(
  action: (...args: Props) => Promise<boolean>,
) {
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args: Props) => {
      setIsLoading(true);

      // TODO: maybe try catch
      await action(...args);

      setIsLoading(false);
    },
    [action],
  );

  return { execute, isLoading };
}
