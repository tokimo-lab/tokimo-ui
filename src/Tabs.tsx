import {
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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

  const tabBarRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const hasInitRef = useRef(false);

  const updateIndicator = useCallback(() => {
    const tabBar = tabBarRef.current;
    const activeTab = tabRefs.current.get(activeKey);
    if (!tabBar || !activeTab) return;
    const barRect = tabBar.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    setIndicatorStyle({
      left: tabRect.left - barRect.left + tabBar.scrollLeft,
      width: tabRect.width,
    });
  }, [activeKey]);

  useLayoutEffect(() => {
    updateIndicator();
    if (!hasInitRef.current) {
      // Skip transition on first render
      requestAnimationFrame(() => {
        hasInitRef.current = true;
      });
    }
  }, [updateIndicator]);

  return (
    <div className={className}>
      {/* Tab Bar */}
      <div className="flex items-center border-b border-black/[0.06] dark:border-white/[0.08]">
        <div
          ref={tabBarRef}
          className={cn(
            "relative flex gap-0 flex-1 overflow-x-auto",
            centered && "justify-center",
          )}
        >
          {items.map((item) => (
            <button
              key={item.key}
              ref={(el) => {
                if (el) tabRefs.current.set(item.key, el);
                else tabRefs.current.delete(item.key);
              }}
              type="button"
              disabled={item.disabled}
              className={cn(
                "relative whitespace-nowrap transition-colors font-medium cursor-pointer",
                sizeClass,
                type === "card" &&
                  "border border-b-0 border-black/[0.06] dark:border-white/[0.08] rounded-t -mb-px",
                activeKey === item.key
                  ? type === "card"
                    ? "bg-white/70 dark:bg-white/[0.03] text-[var(--accent)] border-b-transparent"
                    : "text-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                type === "card" &&
                  activeKey !== item.key &&
                  "bg-black/[0.02] dark:bg-white/[0.03]",
                item.disabled && "opacity-50 !cursor-not-allowed",
              )}
              onClick={() => !item.disabled && handleChange(item.key)}
            >
              <span className="flex items-center gap-1.5 [&>svg]:w-[1em] [&>svg]:h-[1em]">
                {item.icon}
                {item.label}
              </span>
            </button>
          ))}
          {/* Animated active indicator for line type */}
          {type === "line" && (
            <span
              className="absolute bottom-0 h-0.5 bg-[var(--accent)] rounded-t"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
                transition: hasInitRef.current
                  ? "left 0.3s cubic-bezier(0.645, 0.045, 0.355, 1), width 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)"
                  : "none",
              }}
            />
          )}
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
