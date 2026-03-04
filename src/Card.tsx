import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./utils";

export interface CardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Card title */
  title?: ReactNode;
  /** Extra content in the header (e.g. action buttons) */
  extra?: ReactNode;
  /** Size variant */
  size?: "default" | "small";
  /** Remove padding */
  bordered?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Hoverable card */
  hoverable?: boolean;
  /** Card cover image */
  cover?: ReactNode;
  /** Card actions at bottom */
  actions?: ReactNode[];
  /** Custom body style */
  bodyStyle?: React.CSSProperties;
  /** Custom head style */
  headStyle?: React.CSSProperties;
  /** Ant Design v5 styles API */
  styles?: { body?: React.CSSProperties };
}

export function Card({
  title,
  extra,
  size = "default",
  bordered = true,
  loading = false,
  hoverable = false,
  cover,
  actions,
  bodyStyle,
  headStyle,
  className,
  children,
  ...rest
}: CardProps) {
  const hasHeader = title || extra;
  return (
    <div
      className={cn(
        "rounded-lg bg-white dark:bg-slate-900",
        bordered
          ? "border border-slate-200 dark:border-slate-700"
          : "shadow-sm",
        hoverable && "transition-shadow hover:shadow-md cursor-pointer",
        className,
      )}
      {...rest}
    >
      {cover ? (
        <div className="rounded-t-lg overflow-hidden">{cover}</div>
      ) : null}
      {hasHeader ? (
        <div
          className={cn(
            "flex items-center justify-between border-b border-slate-200 dark:border-slate-700",
            size === "small" ? "px-3 py-2" : "px-6 py-4",
          )}
          style={headStyle}
        >
          {title ? (
            <div className="font-medium text-slate-800 dark:text-slate-200">
              {title}
            </div>
          ) : null}
          {extra ? <div className="ml-auto">{extra}</div> : null}
        </div>
      ) : null}
      <div
        className={cn(
          size === "small" ? "p-3" : "p-6",
          loading && "animate-pulse",
        )}
        style={bodyStyle}
      >
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
          </div>
        ) : (
          children
        )}
      </div>
      {actions?.length ? (
        <div className="flex border-t border-slate-200 dark:border-slate-700 divide-x divide-slate-200 dark:divide-slate-700">
          {actions.map((action, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static action list
              key={i}
              className="flex-1 flex items-center justify-center py-3 text-slate-500 hover:text-sky-500 cursor-pointer transition-colors"
            >
              {action}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
