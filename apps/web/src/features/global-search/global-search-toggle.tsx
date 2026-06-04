import { SearchIcon } from "lucide-react";
import { useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { globalSearchIsOpenAtom } from "@/features/global-search/global-search-state";
import { GLOBAL_SEARCH_SHORTCUT } from "@/features/global-search/global-search-utils";
import { cn } from "@/lib/utils";

type GlobalSearchToggleProps = React.ComponentProps<typeof Button>;

export function GlobalSearchToggle({ className, ...props }: GlobalSearchToggleProps) {
  const setGlobalSearchIsOpen = useSetAtom(globalSearchIsOpenAtom);

  return (
    <Button
      aria-label="Open global search"
      className={cn(
        "relative justify-start rounded-lg border border-l2 bg-l2 px-2 text-muted-foreground text-sm hover:border-zinc-950/20 hover:bg-l2 group-data-[state=collapsed]:md:hidden",
        className,
      )}
      onClick={() => setGlobalSearchIsOpen(true)}
      type="button"
      variant="outline"
      {...props}
    >
      <SearchIcon className="text-foreground" />
      <Kbd>{GLOBAL_SEARCH_SHORTCUT}</Kbd>
    </Button>
  );
}
