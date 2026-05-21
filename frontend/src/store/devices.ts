import { API_CLIENT } from "@/api";
import { components } from "@/schemas/dwe_os_2";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { subscribeWithSelector } from "zustand/middleware";

export interface DeviceState {
  devices: Record<string, components["schemas"]["DeviceModel"]>;

  fetchDevices: () => Promise<void>;
  addDevice: (device: components["schemas"]["DeviceModel"]) => void;
  removeDevice: (id: string) => void;
  reset: () => void;

  configureStream: (
    bus_info: string,
    streamInfo: Partial<components["schemas"]["StreamInfoModel"]>,
  ) => void;
  restartStream: (bus_info: string) => void;
  setNickname: (bus_info: string, nickname: string) => void;
  setUVCControl: (
    bus_info: string,
    control_id: number,
    value: number | boolean,
  ) => void;
  addFollower: (leader_bus_info: string, follower_bus_info: string) => void;
  removeFollower: (leader_bus_info: string, follower_bus_info: string) => void;
}

export const useDeviceStore = create<DeviceState>()(
  subscribeWithSelector(
    immer((set, get, store) => ({
      devices: {},
      configureStream: (
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

        API_CLIENT.POST("/api/devices/configure_stream", {
          body: streamInfo,
          keepalive: false,
        }).then((result) => {
          const { data, error } = result;
          console.log(data);

          // If successful...
          set((state) => {
            const device = state.devices[bus_info];

            // TODO: make it base this off of responseData which is not in the API yet
            if (device && device.stream) {
              device.stream.enabled = streamInfo.enabled;
              device.stream.encode_type = streamInfo.encode_type;
              device.stream.endpoints = streamInfo.endpoints;
              device.stream.stream_type = streamInfo.stream_type;
              device.stream.width = streamInfo.stream_format.width;
              device.stream.height = streamInfo.stream_format.height;
              device.stream.interval = streamInfo.stream_format.interval;
            }
          });
        });
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
        try {
          const { data } = await API_CLIENT.GET("/api/devices/map");
          if (data) {
            set((state) => {
              state.devices = data;
            });
          } else {
            console.error("Failed to load device list!");
          }
        } catch (e) {
          console.log(e);
        }
      },
      restartStream: (bus_info: string) => {},
      setNickname: (bus_info: string, nickname: string) => {},
      setUVCControl: (
        bus_info: string,
        control_id: number,
        value: number | boolean,
      ) => {},
      addFollower: (leader_bus_info: string, follower_bus_info: string) => {},
      removeFollower: (
        leader_bus_info: string,
        follower_bus_info: string,
      ) => {},
    })),
  ),
);
