import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";

import { cn } from "@/lib/utils";

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <TogglePrimitive.Root
    className={cn(
      "inline-flex items-center justify-center border-4 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
      "data-[state=on]:border-accent data-[state=on]:text-accent-foreground",
      className
    )}
    {...props}
    ref={ref}
  >
    <TogglePrimitive.Toggle
      className={cn("rounded-full m-1 p-2 hover:bg-border")}
    >
      {children}
    </TogglePrimitive.Toggle>
  </TogglePrimitive.Root>
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle };
