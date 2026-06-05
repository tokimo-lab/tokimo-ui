import { useLocale } from "./locale";
import { Select } from "./Select";
import { cn } from "./utils";

export interface PaginationProps {
  /** Current page (1-based) */
  current?: number;
  /** Total items */
  total?: number;
  /** Items per page */
  pageSize?: number;
  /** Default page size (uncontrolled) */
  defaultPageSize?: number;
  /** Change handler */
  onChange?: (page: number, pageSize: number) => void;
  /** Show size changer */
  showSizeChanger?: boolean;
  /** Page size options */
  pageSizeOptions?: (number | string)[];
  /** Size changer handler */
  onShowSizeChange?: (current: number, size: number) => void;
  /** Show total */
  showTotal?: (total: number, range: [number, number]) => React.ReactNode;
  /** Show quick jumper */
  showQuickJumper?: boolean;
  /** Size */
  size?: "default" | "small";
  /** Simple mode */
  simple?: boolean;
  /** Disabled */
  disabled?: boolean;
  className?: string;
}

export function Pagination({
  current = 1,
  total = 0,
  pageSize: pageSizeProp,
  defaultPageSize = 10,
  onChange,
  showSizeChanger = false,
  pageSizeOptions = [10, 20, 50, 100],
  onShowSizeChange,
  showTotal,
  showQuickJumper: _showQuickJumper = false,
  size = "default",
  simple = false,
  disabled = false,
  className,
}: PaginationProps) {
  const pageSizeSuffix = useLocale().Pagination.pageSizeSuffix;
  const pageSize = pageSizeProp ?? defaultPageSize;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const goTo = (page: number) => {
    if (disabled) return;
    const p = Math.max(1, Math.min(totalPages, page));
    if (p !== current) onChange?.(p, pageSize);
  };

  const sizeClass =
    size === "small" ? "h-6 min-w-6 text-xs px-1" : "h-8 min-w-8 text-sm px-2";
  const btnBase =
    "inline-flex items-center justify-center rounded-md border transition-colors select-none backdrop-blur-sm";

  const inactiveClass = cn(
    "bg-white/70 dark:bg-white/[0.04]",
    "border-black/[0.08] dark:border-white/[0.1]",
    "text-[var(--color-fg-primary)]",
    disabled
      ? "opacity-40 cursor-not-allowed"
      : "hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] cursor-pointer",
  );

  const activeClass = cn(
    "border-[var(--color-accent)] text-white bg-[var(--color-accent)]",
    disabled
      ? "opacity-40 cursor-not-allowed"
      : "hover:bg-[var(--color-accent-hover)] cursor-pointer",
  );

  // Page number generation with ellipsis
  const getPages = () => {
    const pages: (number | "...")[] = [];
    const delta = 2;
    const left = Math.max(2, current - delta);
    const right = Math.min(totalPages - 1, current + delta);

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  const range: [number, number] = [
    (current - 1) * pageSize + 1,
    Math.min(current * pageSize, total),
  ];

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      {showTotal ? (
        <span className="text-sm text-[var(--color-fg-muted)] mr-1">
          {showTotal(total, range)}
        </span>
      ) : null}

      {simple ? (
        <>
          <button
            type="button"
            className={cn(btnBase, sizeClass, inactiveClass)}
            disabled={disabled || current <= 1}
            onClick={() => goTo(current - 1)}
          >
            ‹
          </button>
          <span className="text-sm text-[var(--color-fg-secondary)] px-1">
            {current} / {totalPages}
          </span>
          <button
            type="button"
            className={cn(btnBase, sizeClass, inactiveClass)}
            disabled={disabled || current >= totalPages}
            onClick={() => goTo(current + 1)}
          >
            ›
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className={cn(btnBase, sizeClass, inactiveClass)}
            disabled={disabled || current <= 1}
            onClick={() => goTo(current - 1)}
          >
            ‹
          </button>
          {getPages().map((p, i) =>
            p === "..." ? (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: ellipsis items have no unique key
                key={`e${i}`}
                className="text-[var(--color-fg-muted)] px-0.5 text-sm"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={cn(
                  btnBase,
                  sizeClass,
                  current === p ? activeClass : inactiveClass,
                )}
                onClick={() => goTo(p)}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            className={cn(btnBase, sizeClass, inactiveClass)}
            disabled={disabled || current >= totalPages}
            onClick={() => goTo(current + 1)}
          >
            ›
          </button>
        </>
      )}

      {showSizeChanger ? (
        <Select
          value={pageSize}
          disabled={disabled}
          size={size === "small" ? "small" : "middle"}
          options={pageSizeOptions.map((opt) => ({
            label: `${opt} ${pageSizeSuffix}`,
            value: Number(opt),
          }))}
          onChange={(val: number) => {
            onShowSizeChange?.(current, val);
            onChange?.(1, val);
          }}
        />
      ) : null}
    </div>
  );
}
