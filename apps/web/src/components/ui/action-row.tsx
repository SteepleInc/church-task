import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function ActionRow({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex w-auto items-center gap-1 rounded-b-[inherit] border-t bg-muted/50 p-2 align-middle pb-[max(.5rem,env(safe-area-inset-bottom))]",
        className,
      )}
      data-slot="action-row"
      {...props}
    />
  );
}
