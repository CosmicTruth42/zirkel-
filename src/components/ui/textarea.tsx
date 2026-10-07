import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-20 w-full rounded-md bg-secondary px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground shadow-[0_0_0_1px_var(--color-border)] focus-visible:shadow-[0_0_0_1px_var(--color-ring)]",
        className,
      )}
      {...props}
    />
  );
}
