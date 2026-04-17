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
    <div className={cn("flex", className)}>
      {/* Left nav rail */}
      <nav className="shrink-0 select-none" style={{ width: navWidth }}>
        <div className="flex flex-col gap-1 sticky top-0">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavClick(item.key)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left cursor-pointer",
                  isActive
                    ? "bg-[var(--accent)]/10 text-[var(--accent-text)] font-medium"
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
        className="flex-1 min-w-0 border-l border-border-base"
        innerClassName="pl-6 pr-6"
      >
        <div ref={contentRef}>{children}</div>
      </ScrollArea>
    </div>
  );
}

// ─── Compound export ───

export const ScrollNav = Object.assign(ScrollNavRoot, { Section });
