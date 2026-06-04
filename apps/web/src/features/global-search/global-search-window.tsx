import { SearchIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlobalSearchFooter } from "@/features/global-search/global-search-footer";
import type { GlobalSearchResult } from "@/features/global-search/global-search-types";
import { filterGlobalSearchResults } from "@/features/global-search/global-search-utils";
import { cn } from "@/lib/utils";

const entityBadgeClassName = "ml-auto pl-1.5 border border-white";

type GlobalSearchWindowProps = {
  readonly results: readonly GlobalSearchResult[];
  readonly setOpenState: (open: boolean) => void;
};

export function GlobalSearchWindow({ results, setOpenState }: GlobalSearchWindowProps) {
  const [searchValue, setSearchValue] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(results[0]?.id ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(
    () => filterGlobalSearchResults(results, searchValue),
    [results, searchValue],
  );
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? items[0] ?? null;
  const selectedIndex = selectedItem ? items.findIndex((item) => item.id === selectedItem.id) : -1;

  useEffect(() => {
    setSelectedItemId(items[0]?.id ?? null);
  }, [items]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const selectItem = (item: GlobalSearchResult | null) => {
    if (!item) return;

    setOpenState(false);
    item.onSelect();
  };

  return (
    <form
      className="flex h-full w-full flex-1 flex-col overflow-hidden rounded-md bg-popover text-popover-foreground"
      onSubmit={(event) => {
        event.preventDefault();
        selectItem(selectedItem);
      }}
    >
      <div className="flex items-center border-b px-3">
        <SearchIcon className="mr-2 size-4 shrink-0 opacity-50" />

        <input
          aria-label="Global Search"
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          onChange={(event) => setSearchValue(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpenState(false);
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              const previousIndex = Math.max(0, selectedIndex - 1);
              setSelectedItemId(items[previousIndex]?.id ?? null);
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              const nextIndex = Math.min(items.length - 1, selectedIndex + 1);
              setSelectedItemId(items[nextIndex]?.id ?? null);
            }
          }}
          placeholder="Search"
          ref={inputRef}
          value={searchValue}
        />
      </div>

      <div className="m-0 grid flex-1 grid-cols-1 overflow-hidden p-0 md:grid-cols-2">
        <ScrollArea className="relative h-full flex-1" viewportClassName="h-full">
          <div className="relative flex w-full flex-col gap-1 p-2">
            {items.length === 0 ? (
              <EmptyPanel className="my-auto" />
            ) : (
              items.map((item) => (
                <GlobalSearchListItem
                  isSelected={selectedItem?.id === item.id}
                  item={item}
                  key={item.id}
                  onClick={() => selectItem(item)}
                  onMouseEnter={() => setSelectedItemId(item.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <div className="hidden max-h-[auto] flex-1 overflow-hidden border-l md:block">
          {selectedItem ? <GlobalSearchDetailsPanel item={selectedItem} /> : <EmptyPanel />}
        </div>
      </div>

      <GlobalSearchFooter selectActionText={selectedItem?.actionText} />
    </form>
  );
}

function GlobalSearchListItem({
  isSelected,
  item,
  onClick,
  onMouseEnter,
}: {
  readonly isSelected: boolean;
  readonly item: GlobalSearchResult;
  readonly onClick: () => void;
  readonly onMouseEnter: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      className={cn(
        "flex min-h-12 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground",
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      type="button"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{item.title}</span>
        <span className="block truncate text-muted-foreground text-xs">{item.description}</span>
      </span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-muted-foreground text-xs capitalize",
          entityBadgeClassName,
        )}
      >
        {item.type}
      </span>
    </button>
  );
}

function GlobalSearchDetailsPanel({ item }: { readonly item: GlobalSearchResult }) {
  const Icon = item.icon;

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="font-heading font-medium text-sm">{item.title}</div>
          <div className="text-muted-foreground text-xs capitalize">{item.type}</div>
        </div>
      </div>

      <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>

      <div className="grid gap-2">
        {item.details.map((detail) => (
          <div
            className="rounded-lg border bg-background/50 p-3"
            key={`${item.id}:${detail.label}`}
          >
            <div className="text-muted-foreground text-xs">{detail.label}</div>
            <div className="mt-1 truncate text-sm">{detail.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyPanel({ className }: { readonly className?: string }) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchIcon />
        </EmptyMedia>
        <EmptyTitle>No results found</EmptyTitle>
        <EmptyDescription>
          Try adjusting your search to find what you're looking for.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
