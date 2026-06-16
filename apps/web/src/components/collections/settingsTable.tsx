"use client";

import {
  type Column,
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type RowData,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { type ReactNode, useState } from "react";

import {
  createRowActionsColumn,
  type RowActionsRenderer,
} from "@/components/collections/rowActions";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

declare module "@tanstack/react-table" {
  // Per-column styling hooks for the settings table. `className` is applied to
  // both the header cell and body cells (handy for fixed widths / alignment).
  // biome-ignore lint/correctness/noUnusedVariables: required by the module augmentation signature
  interface ColumnMeta<TData extends RowData, TValue> {
    readonly className?: string;
  }
}

/**
 * A lightweight, Linear-style settings table. Unlike `Collection`, this is meant
 * for settings panes that only need a single, dense table view: no card view, no
 * virtualization, no URL-synced filters or pagination. Sorting and the search
 * filter are kept in local state.
 *
 * It is deliberately generic so other settings surfaces (statuses, templates,
 * etc.) can reuse the same shape.
 */
type SettingsTableProps<TData> = {
  readonly columnsDef: Array<ColumnDef<TData>>;
  readonly data: ReadonlyArray<TData>;
  readonly loading?: boolean;
  /** Stable row identity; defaults to the row index. */
  readonly getRowId?: (row: TData, index: number) => string;
  /** Initial sort (e.g. `[{ id: "name", desc: false }]`). */
  readonly initialSorting?: SortingState;
  /**
   * When provided, the table filters rows by this global string. The matching is
   * delegated to TanStack's `globalFilter`, which compares against every
   * column's accessor value.
   */
  readonly globalFilter?: string;
  /** A leading row pinned to the top of the body (e.g. an inline create row). */
  readonly leadingRow?: ReactNode;
  /**
   * Optional render function for per-row actions (the trailing "..." menu).
   * When provided, an actions column is appended automatically.
   */
  readonly rowActions?: RowActionsRenderer<TData>;
  readonly emptyState?: ReactNode;
};

export function SettingsTable<TData>(props: SettingsTableProps<TData>): ReactNode {
  // eslint-disable-next-line react-compiler/react-compiler
  "use no memo";

  const {
    columnsDef,
    data,
    loading,
    getRowId,
    initialSorting = [],
    globalFilter = "",
    leadingRow,
    rowActions,
    emptyState,
  } = props;

  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  const columns = rowActions ? [...columnsDef, createRowActionsColumn(rowActions)] : columnsDef;

  const table = useReactTable<TData>({
    columns,
    data: data as Array<TData>,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { globalFilter, sorting },
  });

  const rows = table.getRowModel().rows;
  const showLoadingSkeleton = Boolean(loading) && data.length === 0;
  const showEmpty = !showLoadingSkeleton && !leadingRow && rows.length === 0;

  return (
    <table className="w-full caption-bottom border-separate border-spacing-0 text-sm">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                className={cn(
                  "h-9 px-3 text-left align-middle font-normal text-muted-foreground text-sm first:pl-3",
                  header.column.columnDef.meta?.className,
                )}
                key={header.id}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {leadingRow}

        {showLoadingSkeleton
          ? Array.from({ length: 4 }, (_, index) => (
              <tr key={`skeleton-${index}`}>
                <td className="py-2.5 pr-3 pl-1" colSpan={columns.length}>
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-2.5 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </td>
              </tr>
            ))
          : null}

        {showEmpty ? (
          <tr>
            <td colSpan={columns.length}>
              {emptyState ?? (
                <Empty className="min-h-32">
                  <EmptyHeader>
                    <EmptyTitle>Nothing here yet</EmptyTitle>
                    <EmptyDescription>Create one to get started.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </td>
          </tr>
        ) : null}

        {rows.map((row) => (
          <tr className="group/row" key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td
                className={cn(
                  "h-11 px-3 align-middle transition-colors group-hover/row:bg-muted/50",
                  "first:rounded-l-lg first:pl-3 last:rounded-r-lg",
                  cell.column.columnDef.meta?.className,
                  cell.column.id === "actions" && "w-12 pr-2 text-right",
                )}
                key={cell.id}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * A sortable column header button styled for the settings table. Renders the
 * Linear-style up/down arrow only when the column is the active sort.
 */
export function SettingsColumnHeader<TData>({
  column,
  children,
  className,
}: {
  readonly column: Column<TData>;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  const canSort = column.getCanSort();
  const sortDirection = column.getIsSorted();

  if (!canSort) {
    return <span className={className}>{children}</span>;
  }

  return (
    <button
      className={cn(
        "inline-flex items-center gap-1 rounded py-0.5 transition-colors hover:text-foreground",
        className,
      )}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      type="button"
    >
      {children}
      {sortDirection === "asc" ? (
        <ArrowUp className="size-3" />
      ) : sortDirection === "desc" ? (
        <ArrowDown className="size-3" />
      ) : null}
    </button>
  );
}
