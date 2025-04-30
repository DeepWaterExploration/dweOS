import { Monitor, Moon, Sun, SunMoon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { useState } from "react";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  const [mode, setMode] = useState(theme);

  const modes: ("dark" | "light" | "system")[] = ["light", "dark", "system"];

  const updateMode = () => {
    const index = modes.indexOf(theme);
    setTheme(modes[index + 1 < modes.length ? index + 1 : 0]);
  };

  return (
    <Button variant="outline" size="icon" onClick={updateMode}>
      {(() => {
        switch (theme) {
          case "dark":
            return (
              <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-100 transition-all" />
            );
          case "light":
            return (
              <Sun className="h-[1.2rem] w-[1.2rem] scale-100 transition-all" />
            );
          case "system":
            return (
              <SunMoon className="h-[1.2rem] w-[1.2rem] scale-100 transition-all" />
            );
        }
      })()}
    </Button>
  );
}
