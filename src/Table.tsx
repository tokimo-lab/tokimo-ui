import { type ReactNode, useState } from "react";
import { Empty } from "./Empty";
import { Pagination, type PaginationProps } from "./Pagination";
import { Spin } from "./Spin";
import { cn } from "./utils";

/* ─── Types ─── */
export interface TableColumn<T = Record<string, unknown>> {
  /** Column title */
  title?: ReactNode;
  /** Data key */
  dataIndex?: string;
  /** Unique key */
  key?: string;
  /** Render function */
  // biome-ignore lint/suspicious/noExplicitAny: antd compat
  render?: (value: any, record: T, index: number) => ReactNode;
  /** Sorter */
  sorter?: boolean | ((a: T, b: T) => number);
  /** Column filters */
  filters?: { text: ReactNode; value: string }[];
  /** Width */
  width?: number | string;
  /** Min width */
  minWidth?: number | string;
  /** Alignment */
  align?: "left" | "center" | "right";
  /** Fixed column */
  fixed?: "left" | "right";
  /** Ellipsis overflow */
  ellipsis?: boolean;
  /** Custom class for cell */
  className?: string;
  /** Column children for grouping */
  children?: TableColumn<T>[];
}

export interface TableProps<T = Record<string, unknown>> {
  /** Column definitions */
  columns?: TableColumn<T>[];
  /** Data source */
  dataSource?: T[];
  /** Row key */
  rowKey?: string | ((record: T) => string);
  /** Loading state */
  loading?: boolean;
  /** Bordered */
  bordered?: boolean;
  /** Size */
  size?: "small" | "middle" | "large";
  /** Custom empty content */
  locale?: { emptyText?: ReactNode };
  /** Pagination config (false to hide) */
  pagination?: false | PaginationProps;
  /** Change callback */
  onChange?: (pagination: { current: number; pageSize: number }) => void;
  /** Scroll config */
  scroll?: { x?: number | string; y?: number | string };
  /** Expand config for tree data */
  expandable?: {
    defaultExpandAllRows?: boolean;
    expandedRowKeys?: string[];
    onExpand?: (expanded: boolean, record: T) => void;
    childrenColumnName?: string;
    indentSize?: number;
  };
  /** Row class name */
  rowClassName?: string | ((record: T, index: number) => string);
  /** On row handler */
  onRow?: (
    record: T,
    index: number,
  ) => React.HTMLAttributes<HTMLTableRowElement>;
  /** Title above table */
  title?: () => ReactNode;
  /** Summary below table */
  summary?: () => ReactNode;
  /** Extra class */
  className?: string;
  /** Style */
  style?: React.CSSProperties;
  /** Default expand all rows (shorthand for expandable.defaultExpandAllRows) */
  defaultExpandAllRows?: boolean;
  /** Row selection config */
  rowSelection?: {
    /** Currently selected row keys */
    selectedRowKeys?: React.Key[];
    /** Change handler */
    onChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
    /** Selection type */
    type?: "checkbox" | "radio";
    /** Row selectable predicate */
    getCheckboxProps?: (record: T) => { disabled?: boolean };
  };
}

/** Get value from a record by dot path */
function getNestedValue(obj: Record<string, unknown>, path?: string): unknown {
  if (!path) return undefined;
  return path.split(".").reduce<unknown>((o, k) => {
    if (o && typeof o === "object") return (o as Record<string, unknown>)[k];
    return undefined;
  }, obj);
}

function getKey<T>(
  record: T,
  rowKey: string | ((r: T) => string),
  idx: number,
): string {
  if (typeof rowKey === "function") return rowKey(record);
  const val = (record as Record<string, unknown>)[rowKey];
  return val != null ? String(val) : String(idx);
}

/* ─── Tree Row Renderer ─── */
function renderRows<T>(
  dataSource: T[],
  columns: TableColumn<T>[],
  rowKey: string | ((r: T) => string),
  expandable: TableProps<T>["expandable"],
  expandedKeys: Set<string>,
  toggleExpand: (key: string, record: T, expanded: boolean) => void,
  level: number,
  sizeClass: string,
  bordered: boolean,
  rowClassName?: TableProps<T>["rowClassName"],
  onRow?: TableProps<T>["onRow"],
  startIdx = { v: 0 },
): ReactNode[] {
  const childrenField = expandable?.childrenColumnName ?? "children";
  const indentSize = expandable?.indentSize ?? 20;
  const rows: ReactNode[] = [];

  for (const record of dataSource) {
    const idx = startIdx.v++;
    const key = getKey(record, rowKey, idx);
    const kids = (record as Record<string, unknown>)[childrenField] as
      | T[]
      | undefined;
    const hasKids = Array.isArray(kids) && kids.length > 0;
    const expanded = expandedKeys.has(key);
    const rowCls =
      typeof rowClassName === "function"
        ? rowClassName(record, idx)
        : rowClassName;
    const rowProps = onRow?.(record, idx) ?? {};

    rows.push(
      <tr
        key={key}
        className={cn(
          "border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors",
          rowCls,
        )}
        {...rowProps}
      >
        {columns.map((col, ci) => {
          const dataIndex = col.dataIndex ?? col.key;
          const value = getNestedValue(
            record as Record<string, unknown>,
            dataIndex,
          );
          const rendered = col.render
            ? col.render(value, record, idx)
            : (value as ReactNode);

          return (
            <td
              key={col.key ?? col.dataIndex ?? ci}
              className={cn(
                sizeClass,
                col.align === "center" && "text-center",
                col.align === "right" && "text-right",
                col.ellipsis && "truncate max-w-0",
                bordered &&
                  "border-r border-black/[0.06] dark:border-white/[0.08] last:border-r-0",
                col.fixed === "left" &&
                  "sticky left-0 bg-white/70 dark:bg-white/[0.03] z-10",
                col.fixed === "right" &&
                  "sticky right-0 bg-white/70 dark:bg-white/[0.03] z-10",
                col.className,
              )}
              style={{ width: col.width, minWidth: col.minWidth }}
            >
              <span
                className="flex items-center gap-1 w-full"
                style={
                  ci === 0 ? { paddingLeft: level * indentSize } : undefined
                }
              >
                {ci === 0 && hasKids ? (
                  <button
                    type="button"
                    className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-secondary)] w-4"
                    onClick={() => toggleExpand(key, record, !expanded)}
                  >
                    {expanded ? "▾" : "▸"}
                  </button>
                ) : ci === 0 && level > 0 ? (
                  <span className="w-4 shrink-0" />
                ) : null}
                <span
                  className={cn("min-w-0 flex-1", col.ellipsis && "truncate")}
                >
                  {rendered}
                </span>
              </span>
            </td>
          );
        })}
      </tr>,
    );

    if (hasKids && expanded) {
      rows.push(
        ...renderRows(
          kids!,
          columns,
          rowKey,
          expandable,
          expandedKeys,
          toggleExpand,
          level + 1,
          sizeClass,
          bordered,
          rowClassName,
          onRow,
          startIdx,
        ),
      );
    }
  }

  return rows;
}

/* ─── Table Component ─── */
export function Table<T = Record<string, unknown>>({
  columns = [],
  dataSource = [],
  rowKey = "id",
  loading = false,
  bordered = false,
  size = "middle",
  locale,
  pagination,
  onChange,
  scroll,
  expandable,
  defaultExpandAllRows,
  rowClassName,
  onRow,
  title,
  summary,
  className,
  style,
  rowSelection,
}: TableProps<T>) {
  // Expand state
  const [expandedKeysState, setExpandedKeysState] = useState<Set<string>>(
    () => {
      if (expandable?.defaultExpandAllRows || defaultExpandAllRows) {
        const keys = new Set<string>();
        const collect = (items: T[], childField: string) => {
          for (let i = 0; i < items.length; i++) {
            const key = getKey(items[i], rowKey, i);
            keys.add(key);
            const kids = (items[i] as Record<string, unknown>)[childField] as
              | T[]
              | undefined;
            if (Array.isArray(kids)) collect(kids, childField);
          }
        };
        collect(dataSource, expandable?.childrenColumnName ?? "children");
        return keys;
      }
      return new Set(expandable?.expandedRowKeys ?? []);
    },
  );

  const expandedKeys = expandable?.expandedRowKeys
    ? new Set(expandable.expandedRowKeys)
    : expandedKeysState;

  const toggleExpand = (key: string, record: T, expanded: boolean) => {
    const next = new Set(expandedKeys);
    if (expanded) next.add(key);
    else next.delete(key);
    setExpandedKeysState(next);
    expandable?.onExpand?.(expanded, record);
  };

  const sizeClass = {
    small: "px-2 py-1 text-xs",
    middle: "px-3 py-2 text-sm",
    large: "px-4 py-3 text-base",
  }[size];

  // Row selection helpers
  const selectedSet = new Set(rowSelection?.selectedRowKeys ?? []);
  const allKeys = dataSource.map((r, i) => getKey(r, rowKey, i));
  const allSelectableKeys = rowSelection?.getCheckboxProps
    ? allKeys.filter(
        (_, i) => !rowSelection.getCheckboxProps!(dataSource[i]).disabled,
      )
    : allKeys;
  const allSelected =
    allSelectableKeys.length > 0 &&
    allSelectableKeys.every((k) => selectedSet.has(k));
  const someSelected = allSelectableKeys.some((k) => selectedSet.has(k));

  const toggleRow = (key: string, _record: T) => {
    if (!rowSelection?.onChange) return;
    const next = new Set(selectedSet);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    const nextKeys = Array.from(next);
    const nextRows = dataSource.filter((r, i) =>
      next.has(getKey(r, rowKey, i)),
    );
    rowSelection.onChange(nextKeys, nextRows);
  };

  const toggleAll = () => {
    if (!rowSelection?.onChange) return;
    if (allSelected) {
      // Deselect all
      const remaining = Array.from(selectedSet).filter(
        (k) => !allSelectableKeys.includes(String(k)),
      );
      const remainingRows = dataSource.filter((r, i) =>
        remaining.includes(getKey(r, rowKey, i)),
      );
      rowSelection.onChange(remaining, remainingRows);
    } else {
      // Select all
      const next = new Set([...selectedSet, ...allSelectableKeys]);
      const nextKeys = Array.from(next);
      const nextRows = dataSource.filter((r, i) =>
        next.has(getKey(r, rowKey, i)),
      );
      rowSelection.onChange(nextKeys, nextRows);
    }
  };

  // Effective columns (prepend selection column if needed)
  const effectiveColumns: TableColumn<T>[] = rowSelection
    ? [
        {
          key: "__selection__",
          title: (
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected && !allSelected;
              }}
              onChange={toggleAll}
              className="cursor-pointer"
            />
          ) as unknown as string,
          width: 40,
          align: "center" as const,
          // biome-ignore lint/suspicious/noExplicitAny: antd table render signature compat
          render: (_: any, record: T, idx: number) => {
            const key = getKey(record, rowKey, idx);
            const cbProps = rowSelection.getCheckboxProps?.(record);
            return (
              <input
                type="checkbox"
                checked={selectedSet.has(key)}
                disabled={cbProps?.disabled}
                onChange={() => toggleRow(key, record)}
                className="cursor-pointer"
              />
            );
          },
        },
        ...columns,
      ]
    : columns;

  return (
    <div className={cn("w-full", className)} style={style}>
      {title ? <div className="mb-2">{title()}</div> : null}
      <Spin spinning={loading}>
        <div
          className={cn(
            "overflow-auto rounded-lg border border-black/[0.06] dark:border-white/[0.08]",
          )}
          style={{
            maxHeight: scroll?.y,
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(128,128,128,0.4) transparent",
          }}
        >
          <table
            className="w-full border-collapse"
            style={{ minWidth: scroll?.x }}
          >
            <thead>
              <tr className="bg-black/[0.02] dark:bg-white/[0.04]">
                {effectiveColumns.map((col, ci) => (
                  <th
                    key={col.key ?? col.dataIndex ?? ci}
                    className={cn(
                      sizeClass,
                      "text-left font-medium text-[var(--text-secondary)] whitespace-nowrap border-b border-black/[0.06] dark:border-white/[0.08]",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                      bordered &&
                        "border-r border-black/[0.06] dark:border-white/[0.08] last:border-r-0",
                      col.fixed === "left" &&
                        "sticky left-0 bg-black/[0.02] dark:bg-white/[0.04] z-10",
                      col.fixed === "right" &&
                        "sticky right-0 bg-black/[0.02] dark:bg-white/[0.04] z-10",
                    )}
                    style={{ width: col.width, minWidth: col.minWidth }}
                  >
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-transparent">
              {dataSource.length === 0 ? (
                <tr>
                  <td colSpan={effectiveColumns.length}>
                    {locale?.emptyText ?? <Empty />}
                  </td>
                </tr>
              ) : (
                renderRows(
                  dataSource,
                  effectiveColumns,
                  rowKey,
                  expandable,
                  expandedKeys,
                  toggleExpand,
                  0,
                  sizeClass,
                  bordered,
                  rowClassName,
                  onRow,
                )
              )}
            </tbody>
          </table>
        </div>
      </Spin>
      {summary ? <div className="mt-2">{summary()}</div> : null}
      {pagination !== false && pagination ? (
        <div className="mt-4 flex justify-end">
          <Pagination
            {...pagination}
            onChange={(page, pageSize) => {
              pagination.onChange?.(page, pageSize);
              onChange?.({ current: page, pageSize });
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

/* Re-export types for convenience */
export type TableColumnsType<T = Record<string, unknown>> = TableColumn<T>[];
