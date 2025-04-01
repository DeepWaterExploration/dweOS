import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const runCommand = (command: () => void) => {
    command();
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="ml-auto mr-4 text-sm text-muted-foreground hover:text-foreground"
      >
        Help
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
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
                onSelect={() => runCommand(() => navigate("/videos"))}
              >
                Recordings
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
