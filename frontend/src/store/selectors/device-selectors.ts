import { useShallow } from "zustand/shallow";
import { useDeviceStore } from "../devices";
import { canFollow } from "@/lib/util/stream";

export const useAvailableFollowers = (bus_id: string) => {
  return useDeviceStore(
    useShallow((state) => {
      const allDevices = Object.values(state.devices);
      const currentFollowers = state.devices[bus_id].followers;

      return allDevices.reduce<string[]>((res, d) => {
        if (
          d.bus_info !== bus_id &&
          canFollow(d) &&
          !currentFollowers.includes(d.bus_info)
        ) {
          res.push(d.bus_info);
        }
        return res;
      }, []);
    }),
  );
};
