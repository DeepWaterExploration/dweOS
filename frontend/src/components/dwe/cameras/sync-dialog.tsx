import { API_CLIENT } from "@/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DeviceContext from "@/contexts/DeviceContext";
import { GroupIcon } from "lucide-react";
import { useContext, useEffect, useState } from "react";

export const SyncDialog = ({ }) => {
    const device = useContext(DeviceContext)!;
    const [newGroupName, setNewGroupName] = useState("");
    const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState("");

    // const existingGroups = [
    //   "Group A", "E3D"
    // ]

    // TODO: move to global state
    const [existingGroups, setExistingGroups] = useState<string[]>([]);

    useEffect(() => {
        API_CLIENT.GET("/devices/sync_groups").then((data) => {
            if (data.data)
                setExistingGroups(data.data)
        });
    }, []);

    return (
        <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen} >
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                    <GroupIcon className="w-4 h-4" />
                    Add to Sync Group
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Sync Camera Group</DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Option A: Join Existing */}
                    {existingGroups.length > 0 && (
                        <div className="space-y-2">
                            <Label>Join an active group</Label>
                            <Select
                                onValueChange={(val) => {
                                    setSelectedGroup(val);
                                    setNewGroupName(""); // Clear new input if selecting existing
                                }}
                                value={selectedGroup}
                                disabled={!!newGroupName} // Disable if user is typing a new name
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select existing group..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {existingGroups.map((group) => (
                                        <SelectItem key={group} value={group}>
                                            {group}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Option B: Create New */}
                    <div className="space-y-2">
                        <Label>Create a new group</Label>
                        <Input
                            placeholder="e.g. Stereo_Pair_1"
                            value={newGroupName}
                            onChange={(e) => {
                                setNewGroupName(e.target.value);
                                setSelectedGroup(""); // Clear dropdown if typing
                            }}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsGroupDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={() => {
                        API_CLIENT.POST("/devices/set_sync_group", { body: { bus_info: device.bus_info, group: (selectedGroup == "" ? newGroupName : selectedGroup) } })
                        setIsGroupDialogOpen(false);
                        setSelectedGroup("");
                        setNewGroupName("");
                    }}>
                        Join Group
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >

    );
}