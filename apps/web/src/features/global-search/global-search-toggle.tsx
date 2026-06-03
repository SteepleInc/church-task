import { SearchIcon } from "lucide-react";
import { useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { globalSearchIsOpenAtom } from "@/features/global-search/global-search-state";
import { GLOBAL_SEARCH_SHORTCUT } from "@/features/global-search/global-search-utils";

type GlobalSearchToggleProps = React.ComponentProps<typeof Button>;

export function GlobalSearchToggle({ className, ...props }: GlobalSearchToggleProps) {
  const setGlobalSearchIsOpen = useSetAtom(globalSearchIsOpenAtom);

  return (
    <Button
      aria-label="Open global search"
      className={className}
      onClick={() => setGlobalSearchIsOpen(true)}
      type="button"
      variant="outline"
      {...props}
    >
      <SearchIcon className="size-4" />
      <span className="group-data-[state=collapsed]:md:hidden">Search</span>
      <Kbd className="ml-auto group-data-[state=collapsed]:md:hidden">{GLOBAL_SEARCH_SHORTCUT}</Kbd>
    </Button>
  );
}
