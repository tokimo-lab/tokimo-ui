import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { type ReactNode, useLayoutEffect, useRef } from "react";
import { Dropdown } from "./Dropdown";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PillTab<K extends string = string> {
  key: K;
  label: string;
  /** Optional secondary label shown below the main label (e.g. episode count) */
  sublabel?: string;
  icon?: LucideIcon;
  /** Poster image URL shown as a small thumbnail before the label */
  posterSrc?: string;
}

export interface PillTabSortOption {
  label: string;
  value: string;
}

export interface PillTabSort {
  options: readonly PillTabSortOption[];
  value: string;
  onChange: (value: string) => void;
  /** Icon shown next to the active sort option in the dropdown */
  activeIcon?: ReactNode;
}

/** Additional filter dropdown (e.g. genre / category) */
export interface PillTabFilter {
  /** Prefix label shown before selected value (e.g. "类型") */
  label?: string;
  options: readonly PillTabSortOption[];
  value: string;
  onChange: (value: string) => void;
  activeIcon?: ReactNode;
}

export interface PillTabBarProps<K extends string = string> {
  tabs: readonly PillTab<K>[];
  activeTab: K;
  onTabChange: (key: K) => void;
  /** Sort dropdown, shown after a | divider. Can be always-on or per-tab. */
  sort?: PillTabSort;
  /** Extra filter dropdowns after the sort dropdown */
  filters?: readonly PillTabFilter[];
  /** Content rendered right-aligned (e.g. count badge) */
  trailing?: ReactNode;
  /** Sticky positioning at the top of the scroll container (default: true) */
  sticky?: boolean;
  /** Offset class for right-aligned trailing content (default: "right-4") */
  trailingClassName?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function PillTabBar<K extends string>({
  tabs,
  activeTab,
  onTabChange,
  sort,
  filters,
  trailing,
  sticky = true,
  trailingClassName = "right-4",
}: PillTabBarProps<K>) {
  const stickyClass = sticky
    ? "sticky top-0 z-10 -mx-3 -mt-3 mb-0 bg-[var(--bg-primary)] px-3 pt-3 pb-3 lg:-mx-4 lg:-mt-4 lg:px-4 lg:pt-4 lg:pb-3"
    : "pb-3";

  const hasDropdowns = !!sort || (filters && filters.length > 0);

  // ── Sliding indicator ──────────────────────────────────────────────────────
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const sliderRef = useRef<HTMLDivElement>(null);
  const isInitialRef = useRef(true);

  useLayoutEffect(() => {
    const activeEl = tabRefs.current.get(activeTab);
    const slider = sliderRef.current;
    if (!activeEl || !slider) return;

    const { offsetLeft, offsetWidth } = activeEl;

    if (isInitialRef.current) {
      // Snap to position without transition on first paint
      slider.style.transition = "none";
      slider.style.left = `${offsetLeft}px`;
      slider.style.width = `${offsetWidth}px`;
      // Force reflow so the non-transitioned state is committed before re-enabling
      void slider.offsetWidth;
      slider.style.transition = "";
      isInitialRef.current = false;
    } else {
      slider.style.left = `${offsetLeft}px`;
      slider.style.width = `${offsetWidth}px`;
    }
  }, [activeTab]);

  return (
    <div className={stickyClass}>
      <div className="relative flex items-center justify-center">
        <div className="relative inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-black/20 p-1 backdrop-blur-xl dark:border-white/[0.06] dark:bg-white/[0.06]">
          {/* Sliding active pill */}
          <div
            ref={sliderRef}
            className="pointer-events-none absolute inset-y-1 rounded-full bg-white/90 shadow-sm transition-[left,width] duration-200 ease-in-out dark:bg-white/15"
          />

          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                ref={(el) => {
                  if (el) tabRefs.current.set(t.key, el);
                  else tabRefs.current.delete(t.key);
                }}
                type="button"
                className={`relative z-10 flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-medium transition-colors duration-200 ${
                  active
                    ? "text-fg-primary"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
                onClick={() => onTabChange(t.key)}
              >
                {t.posterSrc ? (
                  <img
                    src={t.posterSrc}
                    alt=""
                    className="h-5 w-3.5 flex-shrink-0 rounded object-cover"
                    loading="lazy"
                  />
                ) : Icon ? (
                  <Icon className="h-3.5 w-3.5" />
                ) : null}
                {t.label}
                {t.sublabel && (
                  <span className="text-[11px] font-normal opacity-50">
                    {t.sublabel}
                  </span>
                )}
              </button>
            );
          })}

          {hasDropdowns && (
            <div className="mx-0.5 h-4 w-px bg-white/15 dark:bg-white/10" />
          )}

          {sort && (
            <Dropdown
              trigger={["click"]}
              placement="bottomCenter"
              menu={{
                items: sort.options.map((opt) => ({
                  key: opt.value,
                  label: opt.label,
                  icon: sort.value === opt.value ? sort.activeIcon : undefined,
                })),
                onClick: ({ key }) => sort.onChange(key),
              }}
            >
              <button
                type="button"
                className="relative z-10 flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--text-primary)]"
              >
                {sort.options.find((o) => o.value === sort.value)?.label}
                <ChevronDown className="h-3 w-3" />
              </button>
            </Dropdown>
          )}

          {filters?.map((f, i) => (
            <Dropdown
              // biome-ignore lint/suspicious/noArrayIndexKey: stable order
              key={i}
              trigger={["click"]}
              placement="bottomCenter"
              menu={{
                items: f.options.map((opt) => ({
                  key: opt.value,
                  label: opt.label,
                  icon: f.value === opt.value ? f.activeIcon : undefined,
                })),
                onClick: ({ key }) => f.onChange(key),
              }}
            >
              <button
                type="button"
                className="relative z-10 flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--text-primary)]"
              >
                {f.label && <span className="opacity-60">{f.label}</span>}
                {f.options.find((o) => o.value === f.value)?.label}
                <ChevronDown className="h-3 w-3" />
              </button>
            </Dropdown>
          ))}
        </div>

        {trailing && (
          <div className={`absolute text-right ${trailingClassName}`}>
            {trailing}
          </div>
        )}
      </div>
    </div>
  );
}
