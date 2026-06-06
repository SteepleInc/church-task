import type { Table } from "@tanstack/react-table";
import type { ReactNode } from "react";

import { CollectionFilters } from "@/components/collections/collectionFilters";
import { CollectionSearchFilter } from "@/components/collections/collectionSearchFilter";
import type { CollectionTags } from "@/components/collections/collectionComponents";
import { CollectionViewToggleGroup } from "@/components/collections/collectionViewToggleGroup";
import type { ColumnConfig } from "@/components/data-table-filter/core/types";
import { cn } from "@/lib/utils";
import type { FilterKeys } from "@/shared/global-state";

type CollectionToolbarProps<TData> = {
  readonly _tag: CollectionTags;
  readonly Actions?: ReactNode;
  readonly className?: string;
  readonly data: readonly TData[];
  readonly filterColumnId: string;
  readonly filterKey: FilterKeys;
  readonly filterPlaceHolder: string;
  readonly filtersDef: ReadonlyArray<ColumnConfig<TData>>;
  readonly table: Table<TData>;
};

export function CollectionToolbar<TData>({
  _tag,
  Actions,
  className,
  filterColumnId,
  filterKey,
  filterPlaceHolder,
  filtersDef,
}: CollectionToolbarProps<TData>) {
  return (
    <div className={cn("mb-2 flex flex-col gap-2 pt-1 md:mr-4 md:mb-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <CollectionSearchFilter
          filterColumnId={filterColumnId}
          filterKey={filterKey}
          filterPlaceHolder={filterPlaceHolder}
        />
        <div className="ml-auto flex items-center gap-2">
          <CollectionViewToggleGroup _tag={_tag} size="sm" variant="outline" />
          {Actions}
        </div>
      </div>
      <CollectionFilters filterKey={filterKey} filtersDef={filtersDef} />
    </div>
  );
}
