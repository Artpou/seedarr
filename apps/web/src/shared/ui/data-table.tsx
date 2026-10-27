import type { ReactNode } from "react";

import type { Cell, ReactTable, Row, RowData, TableFeatures } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { useTvFocusable } from "@/shared/ui/tv/use-tv-focusable";

import { useTvMode } from "@/features/tv-mode/tv-mode-store";

export interface DataTableColumnMeta {
  headerClassName?: string;
  cellClassName?: string;
}

export type DataTableTvRow<TFeatures extends TableFeatures, TData extends RowData> = {
  getFocusKey: (row: Row<TFeatures, TData>) => string;
  onPress: (row: Row<TFeatures, TData>) => void;
  getAccessibilityLabel?: (row: Row<TFeatures, TData>) => string;
};

interface DataTableProps<TFeatures extends TableFeatures, TData extends RowData> {
  table: ReactTable<TFeatures, TData>;
  empty?: React.ReactNode;
  className?: string;
  classNameContainer?: string;
  onRowClick?: (row: Row<TFeatures, TData>) => void;
  getRowClassName?: (row: Row<TFeatures, TData>) => string | undefined;
  tvRow?: DataTableTvRow<TFeatures, TData>;
}

function getColumnMeta(columnDef: { meta?: unknown }): DataTableColumnMeta | undefined {
  return columnDef.meta as DataTableColumnMeta | undefined;
}

function DataTableFocusRow<TFeatures extends TableFeatures, TData extends RowData>({
  row,
  tvRow,
  onRowClick,
  getRowClassName,
  children,
}: {
  row: Row<TFeatures, TData>;
  tvRow: DataTableTvRow<TFeatures, TData>;
  onRowClick?: (row: Row<TFeatures, TData>) => void;
  getRowClassName?: (row: Row<TFeatures, TData>) => string | undefined;
  children: ReactNode;
}) {
  const tvMode = useTvMode();
  const focusKey = tvRow.getFocusKey(row);
  const onPress = () => tvRow.onPress(row);
  const { ref, focused } = useTvFocusable({
    focusKey,
    onEnterPress: onPress,
    accessibilityLabel: tvRow.getAccessibilityLabel?.(row),
  });

  if (!tvMode) {
    return (
      <TableRow
        data-state={"getIsSelected" in row && row.getIsSelected() ? "selected" : undefined}
        className={cn(onRowClick && "cursor-pointer", getRowClassName?.(row))}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
      >
        {children}
      </TableRow>
    );
  }

  return (
    <TableRow
      ref={ref}
      data-tv-focus-root
      data-tv-focused={focused}
      data-state={"getIsSelected" in row && row.getIsSelected() ? "selected" : undefined}
      className={cn("cursor-pointer outline-none", getRowClassName?.(row))}
      onClick={onPress}
    >
      {children}
    </TableRow>
  );
}

export function DataTable<TFeatures extends TableFeatures, TData extends RowData>({
  table,
  empty,
  className,
  classNameContainer,
  onRowClick,
  getRowClassName,
  tvRow,
}: DataTableProps<TFeatures, TData>) {
  const tvMode = useTvMode();
  const columns = table.getAllColumns();
  const useTvRows = tvMode && tvRow;

  return (
    <Table className={className} classNameContainer={classNameContainer}>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id} className={getColumnMeta(header.column.columnDef)?.headerClassName}>
                {header.isPlaceholder ? null : <table.FlexRender header={header} />}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length > 0 ? (
          table.getRowModel().rows.map((row) => {
            const cells = row.getAllCells().map((cell: Cell<TFeatures, TData, unknown>) => (
              <TableCell key={cell.id} className={getColumnMeta(cell.column.columnDef)?.cellClassName}>
                <table.FlexRender cell={cell} />
              </TableCell>
            ));

            if (useTvRows) {
              return (
                <DataTableFocusRow
                  key={row.id}
                  row={row}
                  tvRow={tvRow}
                  onRowClick={onRowClick}
                  getRowClassName={getRowClassName}
                >
                  {cells}
                </DataTableFocusRow>
              );
            }

            return (
              <TableRow
                key={row.id}
                data-state={"getIsSelected" in row && row.getIsSelected() ? "selected" : undefined}
                className={cn(onRowClick && "cursor-pointer", getRowClassName?.(row))}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {cells}
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
              {empty}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
