import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const runCommand = (command: () => void) => {
    command();
    setOpen(false);
  };

  return (
    <div id={TOUR_STEP_IDS.HELP_SWITCH}>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-muted-foreground hover:text-foreground p-2"
      >
        <Info className="h-5 w-5" />
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Docs">
              <CommandItem
                onSelect={() =>
                  runCommand(() =>
                    window.open(
                      "https://docs.dwe.ai/software/dwe-os/guides/streaming",
                      "_blank"
                    )
                  )
                }
              >
                Streaming Guide
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
                Overview
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => navigate("/cameras"))}
              >
                Cameras
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => navigate("/recordings"))}
              >
                Recordings
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => navigate("/log-viewer"))}
              >
                Logs
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => navigate("/preferences"))}
              >
                Preferences
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => navigate("/terminal"))}
              >
                Terminal
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}
