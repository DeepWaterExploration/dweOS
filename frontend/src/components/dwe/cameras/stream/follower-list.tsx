import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StreamSelector } from "../stream-selector";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import { useCallback, useState } from "react";
import { useDeviceStore } from "@/store/devices";
import { useAvailableFollowers } from "@/store/selectors/device-selectors";

export const FollowerList = ({
  bus_id,
  disabled,
}: {
  bus_id: string;
  disabled: boolean;
}) => {
  // Full list of devices
  const availableFollowers = useAvailableFollowers(bus_id);
  const addFollower = useDeviceStore((state) => state.addFollower);
  const removeFollower = useDeviceStore((state) => state.removeFollower);
  const device = useDeviceStore((state) => state.devices[bus_id]);
  const isStreamLoading = useDeviceStore(
    (state) => state.isStreamLoading[bus_id] ?? false,
  );

  const noAvailableFollowers = availableFollowers.length === 0;

  const [selectedFollower, setSelectedFollower] = useState("");

  const handleAddFollower = useCallback(
    (newFollower: string) => {
      if (!availableFollowers.includes(newFollower)) {
        console.warn(
          `Cannot add follower: "${newFollower}" that is not in the available followers list.`,
        );
        return;
      }
      addFollower(bus_id, newFollower);
    },
    [bus_id, addFollower, availableFollowers],
  );

  const handleRemoveFollower = useCallback(
    (removedFollower: string) => {
      removeFollower(bus_id, removedFollower);
    },
    [bus_id, removeFollower],
  );

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="followers">
        <AccordionTrigger className="text-sm font-semibold">
          Followers
        </AccordionTrigger>
        <AccordionContent className="w-full">
          <div className="space-y-4">
            {/* Add Dropdown */}
            <div className="grid grid-cols-12 gap-3 w-full items-end">
              <div className="col-span-9">
                <StreamSelector
                  options={availableFollowers}
                  placeholder="Select a device..."
                  label="Add Follower"
                  value={selectedFollower}
                  onChange={setSelectedFollower}
                  disabled={noAvailableFollowers || disabled}
                />
              </div>

              <div className="col-span-3">
                <Button
                  onClick={() => {
                    handleAddFollower(selectedFollower);
                  }}
                  className="w-full"
                  disabled={noAvailableFollowers || isStreamLoading || disabled}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Follower Table */}
            {device.followers.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 rounded-md bg-muted/50">
                No followers connected. Devices that mirror this stream will
                appear here.
              </div>
            ) : (
              <div className="rounded-md border border-background/30 w-full overflow-hidden">
                <table className="w-full table-fixed text-sm text-left">
                  <thead className="bg-background/30">
                    <tr>
                      <th className="px-4 py-2 w-1/2 truncate font-medium">
                        Port
                      </th>
                      <th className="px-4 py-2 w-1/2 truncate font-medium">
                        Device Type
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {device.followers.map((follower, index) => (
                      <tr
                        key={index}
                        className="border-b-2 border-background/30 bg-input last:border-0"
                      >
                        <td className="px-4 py-2 truncate">{follower}</td>
                        <td className="px-4 py-2">
                          <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                            <span className="truncate">stellarHD</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isStreamLoading || disabled}
                              onClick={() => {
                                handleRemoveFollower(follower);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2Icon className="w-4 h-4" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
