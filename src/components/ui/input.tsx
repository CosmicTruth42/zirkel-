import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md bg-secondary px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground shadow-[0_0_0_1px_var(--color-border)] focus-visible:shadow-[0_0_0_1px_var(--color-ring)]",
        className,
      )}
      {...props}
    />
  );
}
