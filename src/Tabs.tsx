import { type ReactNode, useState } from "react";
import { cn } from "./utils";

export interface TabItem {
  key: string;
  label: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  closable?: boolean;
}

export interface TabsProps {
  /** Tab items */
  items?: TabItem[];
  /** Active tab key */
  activeKey?: string;
  /** Default active key */
  defaultActiveKey?: string;
  /** Change handler */
  onChange?: (key: string) => void;
  /** Tab bar extra content */
  tabBarExtraContent?: ReactNode;
  /** Size */
  size?: "small" | "middle" | "large";
  /** Type */
  type?: "line" | "card";
  /** Centered tabs */
  centered?: boolean;
  /** Destroys inactive panes */
  destroyInactiveTabPane?: boolean;
  className?: string;
}

export function Tabs({
  items = [],
  activeKey: activeKeyProp,
  defaultActiveKey,
  onChange,
  tabBarExtraContent,
  size = "middle",
  type = "line",
  centered = false,
  destroyInactiveTabPane = false,
  className,
}: TabsProps) {
  const [internalKey, setInternalKey] = useState(
    defaultActiveKey ?? items[0]?.key ?? "",
  );
  const activeKey = activeKeyProp ?? internalKey;

  const handleChange = (key: string) => {
    if (activeKeyProp === undefined) setInternalKey(key);
    onChange?.(key);
  };

  const sizeClass = {
    small: "text-xs px-2 py-1",
    middle: "text-sm px-3 py-2",
    large: "text-base px-4 py-2.5",
  }[size];

  return (
    <div className={className}>
      {/* Tab Bar */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-700">
        <div
          className={cn(
            "flex gap-0 flex-1 overflow-x-auto",
            centered && "justify-center",
          )}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={item.disabled}
              className={cn(
                "relative whitespace-nowrap transition-colors font-medium cursor-pointer",
                sizeClass,
                type === "card" &&
                  "border border-b-0 border-slate-200 dark:border-slate-700 rounded-t -mb-px",
                activeKey === item.key
                  ? type === "card"
                    ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 border-b-white dark:border-b-slate-900"
                    : "text-sky-600 dark:text-sky-400"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                type === "card" &&
                  activeKey !== item.key &&
                  "bg-slate-50 dark:bg-slate-800",
                item.disabled && "opacity-50 !cursor-not-allowed",
              )}
              onClick={() => !item.disabled && handleChange(item.key)}
            >
              <span className="flex items-center gap-1.5 [&>svg]:w-[1em] [&>svg]:h-[1em]">
                {item.icon}
                {item.label}
              </span>
              {/* Active indicator for line type */}
              {type === "line" && activeKey === item.key ? (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-t" />
              ) : null}
            </button>
          ))}
        </div>
        {tabBarExtraContent ? (
          <div className="shrink-0 ml-auto pl-2">{tabBarExtraContent}</div>
        ) : null}
      </div>
      {/* Tab Panels */}
      {items.map((item) => {
        const isActive = activeKey === item.key;
        if (destroyInactiveTabPane && !isActive) return null;
        return (
          <div
            key={item.key}
            className={cn(!isActive && "hidden")}
            role="tabpanel"
          >
            {item.children}
          </div>
        );
      })}
    </div>
  );
}
