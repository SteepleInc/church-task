import type { ListArgs } from "@church-task/zero";
import { getRouteApi } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import type { FilterItem } from "@/components/data-table-filter/core/types";
import { getListArgsFromSearch } from "@/shared/hooks/useFilters";

const orgRouteApi = getRouteApi("/_org");

type ColumnMap = Record<string, string>;

const mapFilter = (filter: FilterItem, columnMap: ColumnMap) => ({
  ...filter,
  column_id: columnMap[filter.columnId] ?? filter.columnId,
  columnId: undefined,
});

export function useZeroListArgs(params: {
  readonly filterKey: string;
  readonly columnMap: ColumnMap;
  readonly pageSize?: number;
}) {
  const { columnMap, filterKey, pageSize = 50 } = params;
  const search = orgRouteApi.useSearch();
  const [limit, setLimit] = useState(pageSize);
  const listArgs = useMemo<ListArgs>(() => {
    const args = getListArgsFromSearch(search, filterKey);
    const orderBy = args.orderBy ? (columnMap[args.orderBy] ?? args.orderBy) : undefined;

    return {
      ...(args.filters
        ? { filters: args.filters.map((filter) => mapFilter(filter, columnMap)) }
        : {}),
      limit,
      ...(orderBy ? { order_by: orderBy, order_direction: args.orderDirection } : {}),
    } as ListArgs;
  }, [columnMap, filterKey, limit, search]);

  return {
    limit,
    listArgs,
    nextPage: () => setLimit((currentLimit) => currentLimit + pageSize),
    pageSize,
  };
}
