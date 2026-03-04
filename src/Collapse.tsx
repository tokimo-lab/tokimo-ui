import { ChevronRight } from "lucide-react";
import { type ReactNode, useState } from "react";
import { cn } from "./utils";

export interface CollapseItem {
  key: string;
  label: ReactNode;
  children: ReactNode;
  extra?: ReactNode;
  showArrow?: boolean;
  forceRender?: boolean;
}

export interface CollapseProps {
  /** Panel items */
  items?: CollapseItem[];
  /** Active keys */
  activeKey?: string | string[];
  /** Default active keys */
  defaultActiveKey?: string | string[];
  /** Change handler */
  onChange?: (key: string | string[]) => void;
  /** Accordion mode (only one panel open) */
  accordion?: boolean;
  /** Bordered style */
  bordered?: boolean;
  /** Ghost style (transparent bg) */
  ghost?: boolean;
  /** Size */
  size?: "small" | "middle" | "large";
  className?: string;
}

export function Collapse({
  items = [],
  activeKey: activeKeyProp,
  defaultActiveKey,
  onChange,
  accordion = false,
  bordered = true,
  ghost = false,
  size = "middle",
  className,
}: CollapseProps) {
  const normalizeKeys = (v?: string | string[]): string[] =>
    v === undefined ? [] : Array.isArray(v) ? v : [v];

  const [internalKeys, setInternalKeys] = useState<string[]>(
    normalizeKeys(defaultActiveKey),
  );

  const activeKeys =
    activeKeyProp !== undefined ? normalizeKeys(activeKeyProp) : internalKeys;

  const toggle = (key: string) => {
    let next: string[];
    if (accordion) {
      next = activeKeys.includes(key) ? [] : [key];
    } else {
      next = activeKeys.includes(key)
        ? activeKeys.filter((k) => k !== key)
        : [...activeKeys, key];
    }
    if (activeKeyProp === undefined) setInternalKeys(next);
    onChange?.(accordion ? (next[0] ?? "") : next);
  };

  const padClass = {
    small: "px-3 py-1.5 text-xs",
    middle: "px-4 py-2.5 text-sm",
    large: "px-4 py-3 text-base",
  }[size];

  return (
    <div
      className={cn(
        bordered &&
          !ghost &&
          "border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden",
        className,
      )}
    >
      {items.map((item, i) => {
        const isOpen = activeKeys.includes(item.key);
        return (
          <div
            key={item.key}
            className={cn(
              i > 0 &&
                bordered &&
                "border-t border-slate-200 dark:border-slate-700",
            )}
          >
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2 transition-colors",
                padClass,
                ghost
                  ? "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  : "bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50",
              )}
              onClick={() => toggle(item.key)}
            >
              {item.showArrow !== false && (
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200 text-slate-400",
                    isOpen && "rotate-90",
                  )}
                />
              )}
              <span className="flex-1 text-left font-medium text-slate-700 dark:text-slate-200">
                {item.label}
              </span>
              {item.extra && <span className="shrink-0">{item.extra}</span>}
            </button>
            {(isOpen || item.forceRender) && (
              <div
                className={cn(
                  padClass,
                  !isOpen && "hidden",
                  "text-slate-600 dark:text-slate-300",
                  !ghost && "bg-white dark:bg-slate-900",
                )}
              >
                {item.children}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
