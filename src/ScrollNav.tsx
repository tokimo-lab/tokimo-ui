import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ScrollArea, type ScrollAreaRef } from "./ScrollArea";
import { cn } from "./utils";

// ─── Types ───

export interface ScrollNavItem {
  key: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
}

export interface ScrollNavProps {
  /** Nav items — each must match a child `ScrollNav.Section`'s `id`. */
  items: ScrollNavItem[];
  /** Width of the left nav rail (px). @default 140 */
  navWidth?: number;
  /** Navigation placement. Horizontal uses a scrollable top rail. @default "vertical" */
  orientation?: "vertical" | "horizontal";
  className?: string;
  children: ReactNode;
}

export interface ScrollNavSectionProps {
  /** Must match an item key in the parent `ScrollNav`. */
  id: string;
  title?: string;
  className?: string;
  children: ReactNode;
}

// ─── Section (compound component) ───

function Section({ id, title, className, children }: ScrollNavSectionProps) {
  return (
    <section data-scroll-key={id} className={className}>
      {title && (
        <h4 className="text-sm font-semibold text-fg-primary mb-4">{title}</h4>
      )}
      {children}
    </section>
  );
}

// ─── Main ───

function ScrollNavRoot({
  items,
  navWidth = 140,
  orientation = "vertical",
  className,
  children,
}: ScrollNavProps) {
  const [activeKey, setActiveKey] = useState(items[0]?.key ?? "");
  const scrollAreaRef = useRef<ScrollAreaRef>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isClickScrolling = useRef(false);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Scroll-spy: pick the section whose top has scrolled past the viewport top
  const handleScroll = useCallback(
    (_x: number, y: number) => {
      if (isClickScrolling.current) return;
      const content = contentRef.current;
      if (!content) return;

      const sections = Array.from(
        content.querySelectorAll<HTMLElement>("[data-scroll-key]"),
      );

      let active = items[0]?.key ?? "";
      for (const section of sections) {
        if (section.offsetTop - y <= 50) {
          active = section.dataset.scrollKey ?? active;
        }
      }
      setActiveKey(active);
    },
    [items],
  );

  // Reset active key when items change
  useEffect(() => {
    setActiveKey(items[0]?.key ?? "");
  }, [items]);

  const handleNavClick = (key: string) => {
    const content = contentRef.current;
    const area = scrollAreaRef.current;
    if (!content || !area) return;
    const section = content.querySelector<HTMLElement>(
      `[data-scroll-key="${key}"]`,
    );
    if (!section) return;

    setActiveKey(key);
    isClickScrolling.current = true;
    clearTimeout(clickTimer.current);

    area.scrollTo(0, section.offsetTop);

    clickTimer.current = setTimeout(() => {
      isClickScrolling.current = false;
    }, 600);
  };

  return (
    <div
      className={cn(
        "flex",
        orientation === "horizontal" && "flex-col",
        className,
      )}
    >
      {/* Left nav rail */}
      <nav
        className={cn(
          "shrink-0 select-none",
          orientation === "horizontal" && "min-w-0 overflow-x-auto pb-3",
        )}
        style={orientation === "vertical" ? { width: navWidth } : undefined}
      >
        <div
          className={cn(
            "flex gap-1",
            orientation === "vertical" ? "flex-col sticky top-0" : "w-max",
          )}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavClick(item.key)}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left cursor-pointer",
                  orientation === "horizontal" &&
                    "min-h-11 shrink-0 whitespace-nowrap",
                  isActive
                    ? "bg-[var(--color-accent)]/10 text-[var(--color-accent-text)] font-medium"
                    : "text-fg-muted hover:bg-fill-tertiary",
                )}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Right scrollable content */}
      <ScrollArea
        ref={scrollAreaRef}
        direction="vertical"
        onScrollChange={handleScroll}
        className={cn(
          "flex-1 min-h-0 min-w-0",
          orientation === "vertical" && "border-l border-border-base",
        )}
        innerClassName={orientation === "horizontal" ? "px-4" : "pl-6 pr-6"}
      >
        <div ref={contentRef}>{children}</div>
      </ScrollArea>
    </div>
  );
}

// ─── Compound export ───

export const ScrollNav = Object.assign(ScrollNavRoot, { Section });
