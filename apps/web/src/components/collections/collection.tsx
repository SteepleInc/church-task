import { useMemo, useState, type ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type CollectionColumnDef<TItem> = {
  readonly id: string;
  readonly header: string;
  readonly cell: (item: TItem) => ReactNode;
  readonly className?: string;
};

export type CollectionProps<TItem> = {
  readonly _tag: string;
  readonly Actions?: ReactNode;
  readonly columnsDef: readonly CollectionColumnDef<TItem>[];
  readonly data: readonly TItem[];
  readonly filterColumnId: string;
  readonly filterKey: string;
  readonly filterPlaceHolder: string;
  readonly filtersDef?: readonly unknown[];
  readonly getRowKey: (item: TItem) => string;
  readonly getRowLabel: (item: TItem) => string;
  readonly loading?: boolean;
  readonly rowActions?: (item: TItem) => ReactNode;
};

export function Collection<TItem>({
  Actions,
  columnsDef,
  data,
  filterColumnId,
  filterPlaceHolder,
  getRowKey,
  getRowLabel,
  loading = false,
  rowActions,
}: CollectionProps<TItem>) {
  const [query, setQuery] = useState("");
  const filterColumn = columnsDef.find((column) => column.id === filterColumnId) ?? columnsDef[0];
  const filteredData = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return data;
    }

    return data.filter((item) => {
      const primaryValue = filterColumn ? String(filterColumn.cell(item) ?? "") : "";
      const rowValue = [primaryValue, getRowLabel(item)].join(" ");

      return rowValue.toLowerCase().includes(normalizedQuery);
    });
  }, [data, filterColumn, getRowLabel, query]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="-mt-1 mb-2 flex items-center gap-2 pt-1 md:mr-4 md:mb-4">
        <Input
          className="h-9 max-w-sm"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={filterPlaceHolder}
          value={query}
        />
        {Actions}
      </div>

      {loading ? (
        <Card className="flex min-h-48 items-center justify-center text-muted-foreground text-sm">
          Loading...
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          {filteredData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {columnsDef.map((column) => (
                    <TableHead key={column.id}>{column.header}</TableHead>
                  ))}
                  {rowActions ? <TableHead className="w-px" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow aria-label={getRowLabel(item)} key={getRowKey(item)}>
                    {columnsDef.map((column) => (
                      <TableCell className={column.className} key={column.id}>
                        {column.cell(item)}
                      </TableCell>
                    ))}
                    {rowActions ? <TableCell>{rowActions(item)}</TableCell> : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty className="min-h-48 border-0">
              <EmptyHeader>
                <EmptyTitle>No records found</EmptyTitle>
                <EmptyDescription>
                  Try a different search or switch Church context.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </Card>
      )}
    </div>
  );
}
