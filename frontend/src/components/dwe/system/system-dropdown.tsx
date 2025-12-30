import { Power, PowerCircle, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { API_CLIENT } from "@/api";
import { useState } from "react";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";

export function SystemDropdown() {
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<"restart" | "shutdown" | null>(null);

  const handleAction = async () => {
    if (!action) return;

    try {
      if (action === "restart") {
        await API_CLIENT.POST("/system/restart");
        toast({ title: "System is restarting..." });
      } else if (action === "shutdown") {
        await API_CLIENT.POST("/system/shutdown");
        toast({ title: "System is shutting down..." });
      }
    } catch (error) {
      toast({ title: `Failed to ${action}`, variant: "destructive" });
    } finally {
      setDialogOpen(false);
      setAction(null);
    }
  };

  const confirmAction = (type: "restart" | "shutdown") => {
    setAction(type);
    setDialogOpen(true);
  };

  return (
    <div id={TOUR_STEP_IDS.POWER_SWITCH}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Power />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-56 max-h-64 overflow-y-auto"
        >
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>System Configuration</span>
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => confirmAction("restart")}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Restart
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => confirmAction("shutdown")}>
            <PowerCircle className="mr-2 h-4 w-4" />
            Shutdown
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Warning Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm {action === "restart" ? "Restart" : "Shutdown"}
            </DialogTitle>
            <DialogDescription>
              {action === "restart"
                ? "This will restart the entire system running DWE OS. Active processes will be interrupted."
                : "This will shut down the entire system running DWE OS. Make sure to save your work before proceeding."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleAction}>
              {action === "restart" ? "Restart System" : "Shut Down System"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
