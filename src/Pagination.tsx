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
  const pageSize = pageSizeProp ?? defaultPageSize;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const goTo = (page: number) => {
    if (disabled) return;
    const p = Math.max(1, Math.min(totalPages, page));
    if (p !== current) onChange?.(p, pageSize);
  };

  const btnClass = cn(
    "inline-flex items-center justify-center border border-slate-300 dark:border-slate-600 rounded transition-colors",
    size === "small" ? "h-6 min-w-6 text-xs px-1" : "h-8 min-w-8 text-sm px-2",
    disabled
      ? "opacity-50 cursor-not-allowed"
      : "hover:border-sky-500 hover:text-sky-500 cursor-pointer",
  );

  const activeClass =
    "border-sky-500 text-sky-600 dark:text-sky-400 dark:border-sky-500 bg-sky-50 dark:bg-sky-950";

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
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {showTotal ? (
        <span className="text-sm text-slate-500 dark:text-slate-400 mr-2">
          {showTotal(total, range)}
        </span>
      ) : null}

      {simple ? (
        <>
          <button
            type="button"
            className={btnClass}
            disabled={disabled || current <= 1}
            onClick={() => goTo(current - 1)}
          >
            ‹
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {current} / {totalPages}
          </span>
          <button
            type="button"
            className={btnClass}
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
            className={btnClass}
            disabled={disabled || current <= 1}
            onClick={() => goTo(current - 1)}
          >
            ‹
          </button>
          {getPages().map((p, i) =>
            p === "..." ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: ellipsis items have no unique key
              <span key={`e${i}`} className="text-slate-400 px-1">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={cn(btnClass, current === p && activeClass)}
                onClick={() => goTo(p)}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            className={btnClass}
            disabled={disabled || current >= totalPages}
            onClick={() => goTo(current + 1)}
          >
            ›
          </button>
        </>
      )}

      {showSizeChanger ? (
        <select
          className={cn(
            "border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-sm",
            size === "small" ? "h-6 text-xs" : "h-8",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          value={pageSize}
          disabled={disabled}
          onChange={(e) => {
            const newSize = Number(e.target.value);
            onShowSizeChange?.(current, newSize);
            onChange?.(1, newSize);
          }}
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt} / 页
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
