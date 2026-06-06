import { Search, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FilterKeys } from "@/shared/global-state";
import { useFilters } from "@/shared/hooks/useFilters";

type CollectionSearchFilterProps = {
  readonly className?: string;
  readonly filterColumnId: string;
  readonly filterKey: FilterKeys;
  readonly filterPlaceHolder: string;
};

export function CollectionSearchFilter({
  className,
  filterColumnId,
  filterKey,
  filterPlaceHolder,
}: CollectionSearchFilterProps) {
  const [filters, setFilters] = useFilters(filterKey);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlValue = filters.find((filter) => filter.columnId === filterColumnId)?.values[0] ?? "";
  const [inputValue, setInputValue] = useState(urlValue);

  useEffect(() => {
    setInputValue(urlValue);
  }, [urlValue]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const setSearchFilter = (value: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const trimmedValue = value.trim();

      setFilters((currentFilters) => {
        const withoutSearch = currentFilters.filter((filter) => filter.columnId !== filterColumnId);

        if (!trimmedValue) {
          return withoutSearch;
        }

        return [
          ...withoutSearch,
          {
            columnId: filterColumnId,
            operator: "contains",
            type: "text",
            values: [trimmedValue],
          },
        ];
      });
    }, 300);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setSearchFilter(event.target.value);
  };

  const handleClear = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setInputValue("");
    setFilters((currentFilters) =>
      currentFilters.filter((filter) => filter.columnId !== filterColumnId),
    );
  };

  return (
    <label className={cn("relative flex w-full max-w-sm items-center", className)}>
      <Search className="absolute left-2.5 size-4 text-muted-foreground" />
      <Input
        className="rounded-full pr-8 pl-8"
        onChange={handleChange}
        placeholder={filterPlaceHolder}
        value={inputValue}
      />
      {inputValue ? (
        <Button
          aria-label="Clear search"
          className="absolute right-1.5 rounded-full text-muted-foreground"
          onClick={handleClear}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <X className="size-3.5" />
        </Button>
      ) : null}
    </label>
  );
}
