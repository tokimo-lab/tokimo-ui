import { Check } from "lucide-react";
import type { AppSidebarProps } from "./AppSidebar";
import { cn } from "./utils";

export type AppSidebarListProps = Pick<
  AppSidebarProps,
  "sections" | "activeKey" | "activeKeys" | "onSelect" | "loading"
>;

/** Text-first navigation shared by mobile sheets and master-detail lists. */
export function AppSidebarList({
  sections,
  activeKey,
  activeKeys,
  onSelect,
  loading,
}: AppSidebarListProps) {
  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center" role="status">
        <div className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent text-fg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3">
      {sections.map((section, index) => (
        <div key={section.key ?? index}>
          {section.label && (
            <div className="px-3 pb-2 text-xs font-medium text-fg-muted">
              {section.label}
            </div>
          )}
          <div className="space-y-1">
            {section.items.map((item) => {
              const active =
                item.key === activeKey ||
                item.active === true ||
                activeKeys?.includes(item.key);
              return (
                <div
                  key={item.key}
                  className={cn(
                    "flex min-h-12 items-center rounded-xl",
                    active && "bg-accent-subtle",
                  )}
                >
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => onSelect?.(item.key)}
                    className={cn(
                      "flex min-h-12 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left outline-none transition-colors hover:bg-surface-overlay-hover focus-visible:ring-2 focus-visible:ring-accent",
                      active ? "text-accent-text" : "text-fg-primary",
                    )}
                  >
                    {item.icon && (
                      <span className="flex size-6 shrink-0 items-center justify-center [&>svg]:size-5">
                        {item.icon}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-medium">
                        {item.label}
                      </span>
                      {item.subtitle && (
                        <span className="block break-words text-xs text-fg-secondary">
                          {item.subtitle}
                        </span>
                      )}
                      {item.content}
                    </span>
                    {active && <Check size={18} className="shrink-0" />}
                  </button>
                  {item.extra != null && (
                    <div className="shrink-0 pr-3 text-xs text-fg-secondary">
                      {item.extra}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
