// components/ui/list.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

// List Container
export interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  dense?: boolean;
  disablePadding?: boolean;
}

const List = React.forwardRef<HTMLUListElement, ListProps>(
  ({ className, dense = false, disablePadding = false, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn(
        "text-foreground",
        !disablePadding && "py-2",
        dense ? "space-y-0.5" : "space-y-1",
        className
      )}
      {...props}
    />
  )
);
List.displayName = "List";

// List Item
const listItemVariants = cva(
  "relative flex items-center gap-3 rounded-md text-sm transition-colors",
  {
    variants: {
      variant: {
        default: "hover:bg-accent/50 hover:text-accent-foreground",
        selected: "bg-accent text-accent-foreground",
        disabled: "opacity-50 cursor-not-allowed pointer-events-none",
      },
      size: {
        default: "px-3 py-2",
        dense: "px-2 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ListItemProps
  extends React.LiHTMLAttributes<HTMLLIElement>,
    VariantProps<typeof listItemVariants> {
  asChild?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  (
    {
      className,
      asChild = false,
      variant,
      size,
      selected = false,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "li";
    return (
      <Comp
        ref={ref}
        className={cn(
          listItemVariants({
            variant: disabled ? "disabled" : selected ? "selected" : variant,
            size,
          }),
          className
        )}
        {...props}
      />
    );
  }
);
ListItem.displayName = "ListItem";

// List Item Icon
export interface ListItemIconProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const ListItemIcon = React.forwardRef<HTMLDivElement, ListItemIconProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        className={cn(
          "flex-shrink-0 flex items-center justify-center text-muted-foreground",
          className
        )}
        {...props}
      />
    );
  }
);
ListItemIcon.displayName = "ListItemIcon";

// List Item Text
export interface ListItemTextProps
  extends React.HTMLAttributes<HTMLDivElement> {
  primary?: React.ReactNode;
  secondary?: React.ReactNode;
}

const ListItemText = React.forwardRef<HTMLDivElement, ListItemTextProps>(
  ({ className, primary, secondary, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col min-w-0 flex-1", className)}
      {...props}
    >
      {primary && <span className="text-sm leading-tight">{primary}</span>}
      {secondary && (
        <span className="text-xs text-muted-foreground leading-tight mt-0.5">
          {secondary}
        </span>
      )}
    </div>
  )
);
ListItemText.displayName = "ListItemText";

// List Subheader
export interface ListSubheaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  disableSticky?: boolean;
  inset?: boolean;
}

const ListSubheader = React.forwardRef<HTMLDivElement, ListSubheaderProps>(
  ({ className, disableSticky = false, inset = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider",
        !disableSticky && "sticky top-0 z-10 bg-background",
        inset && "pl-10",
        className
      )}
      {...props}
    />
  )
);
ListSubheader.displayName = "ListSubheader";

// List Divider
export interface ListDividerProps extends React.HTMLAttributes<HTMLLIElement> {
  inset?: boolean;
}

const ListDivider = React.forwardRef<HTMLLIElement, ListDividerProps>(
  ({ className, inset = false, ...props }, ref) => (
    <li
      ref={ref}
      className={cn("border-t border-border my-1", inset && "ml-10", className)}
      role="separator"
      {...props}
    />
  )
);
ListDivider.displayName = "ListDivider";

export {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  ListDivider,
};
