/**
 * AppSidebar — shared left-sidebar navigation component.
 *
 * Active indicator slides between items with animation.
 * Supports section labels (小字隔开), two-line items with subtitle,
 * header/footer slots, and trailing extra content.
 */

import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Tooltip } from "./Tooltip";
import { cn } from "./utils";

export interface AppSidebarItem {
  key: string;
  icon?: ReactNode;
  /** Icon shown in collapsed (icon-only) mode — falls back to icon if not provided */
  collapsedIcon?: ReactNode;
  label: string;
  /** Second-line text displayed below the label */
  subtitle?: string;
  /** Trailing content (e.g., edit button) rendered at the right side */
  extra?: ReactNode;
  /** Tooltip text shown on hover */
  tooltip?: string;
  /** Rich content rendered below the main label row (e.g., charts, badges) */
  content?: ReactNode;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export interface AppSidebarSection {
  key?: string;
  /** Small uppercase header text separating groups */
  label?: string;
  items: AppSidebarItem[];
}

export interface AppSidebarProps {
  /** Width in pixels (default: 188) */
  width?: number;
  /** Header content rendered inside the standard header wrapper */
  header?: ReactNode;
  /** Navigation sections */
  sections: AppSidebarSection[];
  /** Currently active item key */
  activeKey?: string;
  /** Called when an item is clicked */
  onSelect?: (key: string) => void;
  /** Footer content rendered inside the standard footer wrapper */
  footer?: ReactNode;
  /** Extra top padding (px) added above the nav items — use for macOS traffic-light inset */
  topInset?: number;
  /** Show a centered spinner instead of items */
  loading?: boolean;
  /** When true, renders a 48 px icon-only sidebar with tooltips */
  collapsed?: boolean;
  className?: string;
  /** CSS custom properties or other inline styles on the container */
  style?: React.CSSProperties;
}

export function AppSidebar({
  width = 188,
  header,
  sections,
  activeKey,
  onSelect,
  footer,
  loading,
  topInset,
  collapsed,
  className,
  style,
}: AppSidebarProps) {
  const itemsRef = useRef<HTMLDivElement>(null);
  const canAnimate = useRef(false);
  const [indicator, setIndicator] = useState<{
    top: number;
    height: number;
  } | null>(null);

  // Stable fingerprint of section item keys — recalculate indicator when items change (e.g. search filter)
  const sectionFingerprint = sections
    .map((s) => s.items.map((i) => i.key).join(","))
    .join("|");

  // biome-ignore lint/correctness/useExhaustiveDependencies: sectionFingerprint triggers recalculation when items change (e.g. search filter)
  useLayoutEffect(() => {
    if (!activeKey || !itemsRef.current) {
      setIndicator(null);
      return;
    }
    const container = itemsRef.current;
    let activeEl: HTMLElement | null = null;
    for (const el of container.querySelectorAll("[data-sidebar-key]")) {
      if (el.getAttribute("data-sidebar-key") === activeKey) {
        activeEl = el as HTMLElement;
        break;
      }
    }
    if (!activeEl) {
      setIndicator(null);
      return;
    }
    const top = activeEl.offsetTop;
    const height = activeEl.offsetHeight;
    setIndicator((prev) => {
      if (prev && prev.top === top && prev.height === height) return prev;
      return { top, height };
    });
  }, [activeKey, sectionFingerprint, collapsed]);

  // Enable slide animation after initial positioning
  useEffect(() => {
    canAnimate.current = true;
  }, []);

  // Reset animation on mode change to avoid cross-mode sliding
  const prevCollapsed = useRef(collapsed);
  useLayoutEffect(() => {
    if (prevCollapsed.current !== collapsed) {
      canAnimate.current = false;
      prevCollapsed.current = collapsed;
      requestAnimationFrame(() => {
        canAnimate.current = true;
      });
    }
  }, [collapsed]);

  // ── Collapsed (icon-only) mode ────────────────────────────────────
  if (collapsed) {
    return (
      <div
        className={cn(
          "flex shrink-0 flex-col overflow-hidden border-r border-border-base bg-[var(--sidebar-bg)] select-none",
          className,
        )}
        style={{ width: 48, ...style }}
      >
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-40" />
          </div>
        ) : (
          <div
            className="flex flex-1 flex-col items-center overflow-y-auto px-1 pt-2"
            style={topInset ? { paddingTop: topInset } : undefined}
          >
            <div
              ref={itemsRef}
              className="relative flex w-full flex-col items-center gap-0.5"
            >
              {/* Sliding accent indicator */}
              {indicator && (
                <span
                  className="pointer-events-none absolute left-0 z-10 w-[3px] rounded-r-full bg-[var(--accent)]"
                  style={{
                    top: indicator.top + (indicator.height - 28) / 2,
                    height: 28,
                    transition: canAnimate.current
                      ? "top 200ms ease-out"
                      : "none",
                  }}
                />
              )}
              {sections.map((section, si) => {
                if (section.items.length === 0) return null;
                const hasPrevNonEmpty = sections
                  .slice(0, si)
                  .some((s) => s.items.length > 0);
                return (
                  <div
                    key={section.key ?? `s-${si}`}
                    className="flex w-full flex-col items-center"
                  >
                    {hasPrevNonEmpty && (
                      <div className="my-1 w-6 border-t border-black/[0.08] dark:border-white/[0.08]" />
                    )}
                    {section.items.map((item) => {
                      const isActive = activeKey === item.key;
                      const btn = (
                        <div
                          key={item.key}
                          data-sidebar-key={item.key}
                          className="relative"
                        >
                          <button
                            type="button"
                            onClick={() => onSelect?.(item.key)}
                            onContextMenu={item.onContextMenu}
                            className={cn(
                              "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors",
                              isActive
                                ? ""
                                : "text-fg-muted hover:bg-black/[0.08] dark:hover:bg-white/[0.08]",
                            )}
                          >
                            {item.collapsedIcon ?? item.icon}
                          </button>
                          {item.extra && (
                            <span className="pointer-events-none absolute -top-1 -right-1">
                              {item.extra}
                            </span>
                          )}
                        </div>
                      );
                      return (
                        <Tooltip
                          key={item.key}
                          title={item.tooltip ?? item.label}
                          placement="right"
                        >
                          {btn}
                        </Tooltip>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {footer && (
          <div className="shrink-0 border-t border-black/[0.06] px-1 py-1 dark:border-white/[0.08]">
            {footer}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col overflow-hidden border-r border-border-base bg-[var(--sidebar-bg)] select-none",
        className,
      )}
      style={{ width, ...style }}
    >
      {header && (
        <div className="flex shrink-0 items-center gap-2 border-b border-black/[0.06] px-3 pt-4 pb-3 dark:border-white/[0.08]">
          {header}
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-40" />
        </div>
      ) : (
        <div
          className="flex-1 overflow-y-auto px-2 pt-3"
          style={topInset ? { paddingTop: topInset } : undefined}
        >
          <div ref={itemsRef} className="relative isolate">
            {/* Sliding active indicator */}
            {indicator && (
              <div
                className="pointer-events-none absolute inset-x-0 z-[-1] rounded-lg bg-black/[0.06] dark:bg-white/[0.06]"
                style={{
                  top: indicator.top,
                  height: indicator.height,
                  transition: canAnimate.current
                    ? "top 200ms ease-out, height 200ms ease-out"
                    : "none",
                }}
              />
            )}
            {sections.map((section, si) => (
              <div key={section.key ?? `s-${si}`}>
                {section.label && (
                  <div
                    className={cn(
                      "mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-fg-muted",
                      si > 0 && "mt-3",
                    )}
                  >
                    {section.label}
                  </div>
                )}
                {section.items.map((item) => (
                  <SidebarItemButton
                    key={item.key}
                    item={item}
                    isActive={activeKey === item.key}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {footer && (
        <div className="shrink-0 border-t border-black/[0.06] px-2 py-2 dark:border-white/[0.08]">
          {footer}
        </div>
      )}
    </div>
  );
}

function SidebarItemButton({
  item,
  isActive,
  onSelect,
}: {
  item: AppSidebarItem;
  isActive: boolean;
  onSelect?: (key: string) => void;
}) {
  const hasContent = !!item.content;

  const itemClasses = cn(
    "mb-0.5 flex w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
    hasContent ? "flex-col" : "items-center gap-2.5",
    isActive
      ? "text-fg-primary font-medium"
      : "text-fg-muted hover:bg-black/[0.06] dark:hover:bg-white/[0.06]",
    item.extra != null && "group/sidebar-item",
  );

  const mainRow = (
    <>
      {item.icon && <span className="shrink-0">{item.icon}</span>}
      {item.subtitle ? (
        <div className="min-w-0 flex-1">
          <span className="block truncate leading-tight">{item.label}</span>
          <span className="mt-0.5 block truncate text-[10px] text-fg-muted">
            {item.subtitle}
          </span>
        </div>
      ) : (
        <span className="min-w-0 flex-1 truncate leading-tight">
          {item.label}
        </span>
      )}
      {item.extra && <div className="shrink-0">{item.extra}</div>}
    </>
  );

  const fullContent = hasContent ? (
    <>
      <div className="flex w-full items-center gap-2.5">{mainRow}</div>
      <div className="mt-1.5 w-full">{item.content}</div>
    </>
  ) : (
    mainRow
  );

  if (item.extra) {
    const el = (
      // biome-ignore lint/a11y/useSemanticElements: div wrapper needed for nested interactive content in extra
      <div
        data-sidebar-key={item.key}
        role="button"
        tabIndex={0}
        onClick={() => onSelect?.(item.key)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.(item.key);
          }
        }}
        onContextMenu={item.onContextMenu}
        className={itemClasses}
      >
        {fullContent}
      </div>
    );
    return item.tooltip ? (
      <Tooltip title={item.tooltip} placement="right">
        {el}
      </Tooltip>
    ) : (
      el
    );
  }

  const btn = (
    <button
      data-sidebar-key={item.key}
      type="button"
      onClick={() => onSelect?.(item.key)}
      onContextMenu={item.onContextMenu}
      className={itemClasses}
    >
      {fullContent}
    </button>
  );
  return item.tooltip ? (
    <Tooltip title={item.tooltip} placement="right">
      {btn}
    </Tooltip>
  ) : (
    btn
  );
}
