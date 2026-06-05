import { Boolean, pipe } from "effect";
import { Moon, Sun } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ModeToggle(props: ComponentProps<typeof Button>) {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <Button
      onClick={() =>
        pipe(
          resolvedTheme === "dark",
          Boolean.match({
            onFalse: () => setTheme("dark"),
            onTrue: () => setTheme("light"),
          }),
        )
      }
      size="icon"
      variant="ghost"
      {...props}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
