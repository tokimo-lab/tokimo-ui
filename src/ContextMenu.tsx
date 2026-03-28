import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FloatingVibrancy } from "./FloatingVibrancy";
import { cn } from "./utils";

/* ─── Types ─── */

export interface ContextMenuItem {
  key?: string;
  label?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  /** Divider or group title */
  type?: "divider" | "group";
  onClick?: () => void;
}

export interface ContextMenuProps {
  /** Menu items */
  items: ContextMenuItem[];
  /** Trigger area */
  children: ReactNode;
  /** Extra class on container */
  className?: string;
}

interface MenuState {
  visible: boolean;
  x: number;
  y: number;
}

/* ─── Menu panel ─── */

function MenuPanel({
  items,
  x,
  y,
  onClose,
  visible,
  bottomAnchor,
}: {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
  visible: boolean;
  /** When true, y is the bottom edge — menu grows upward */
  bottomAnchor?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Adjust position to keep inside viewport (sync before paint to avoid flash)
  const [pos, setPos] = useState({ x, y });

  useLayoutEffect(() => {
    let nx = x;
    let ny = y;
    if (panelRef.current && visible) {
      const rect = panelRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (bottomAnchor) ny = y - rect.height;
      if (nx + rect.width > vw - 8) nx = vw - rect.width - 8;
      if (ny + rect.height > vh - 8) ny = vh - rect.height - 8;
      if (nx < 8) nx = 8;
      if (ny < 8) ny = 8;
    }
    setPos({ x: nx, y: ny });
  }, [x, y, visible, bottomAnchor]);

  const originX = pos.x < x ? "right" : "left";
  const originY = pos.y < y ? "bottom" : "top";

  // Dismiss on outside click / scroll / escape
  useEffect(() => {
    if (!visible) return;
    const handleDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleScroll = () => onClose();
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [visible, onClose]);

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: pos.y,
        left: pos.x,
        zIndex: 9999,
        borderRadius: "var(--window-radius, 12px)",
        backdropFilter: "blur(var(--window-blur, 24px))",
        WebkitBackdropFilter: "blur(var(--window-blur, 24px))",
      }}
      className={cn(
        "min-w-[160px] border shadow-2xl overflow-hidden",
        "transition-[opacity,transform] duration-150 ease-out",
        originY === "top" && originX === "left" && "origin-top-left",
        originY === "top" && originX === "right" && "origin-top-right",
        originY === "bottom" && originX === "left" && "origin-bottom-left",
        originY === "bottom" && originX === "right" && "origin-bottom-right",
        visible
          ? "opacity-100 scale-100"
          : "opacity-0 scale-95 pointer-events-none",
        // glass morphism — light
        "bg-[rgba(255,255,255,calc(var(--window-opacity,85)/100))] border-black/[0.07] ring-1 ring-black/5",
        // dark
        "dark:bg-[rgba(18,18,28,calc(var(--window-opacity,85)/100))] dark:border-white/[0.09] dark:ring-white/[0.06] dark:shadow-black/60",
      )}
    >
      <FloatingVibrancy />
      <div className="relative py-1.5">
        {items.map((item, i) => {
          if (item.type === "divider") {
            return (
              <div
                key={item.key ?? `d-${i}`}
                className="my-1 mx-2 h-px bg-black/[0.06] dark:bg-white/[0.08]"
              />
            );
          }
          if (item.type === "group") {
            return (
              <div
                key={item.key ?? `g-${i}`}
                className="px-3 py-1 text-xs font-medium text-[var(--text-tertiary)] select-none"
              >
                {item.label}
              </div>
            );
          }
          return (
            <button
              key={item.key ?? `item-${i}`}
              type="button"
              disabled={item.disabled}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-left",
                "transition-colors duration-100 cursor-pointer select-none",
                item.danger
                  ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40"
                  : "text-[var(--text-primary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
                item.disabled && "opacity-40 !cursor-not-allowed",
              )}
              onClick={() => {
                if (item.disabled) return;
                item.onClick?.();
                onClose();
              }}
            >
              {item.icon ? (
                <span className="shrink-0 inline-flex [&>svg]:w-[1em] [&>svg]:h-[1em] opacity-70">
                  {item.icon}
                </span>
              ) : null}
              <span className="flex-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>,
    document.fullscreenElement ?? document.body,
  );
}

/* ─── Main component ─── */

export function ContextMenu({ items, children, className }: ContextMenuProps) {
  const [state, setState] = useState<MenuState>({
    visible: false,
    x: 0,
    y: 0,
  });

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState({ visible: true, x: e.clientX, y: e.clientY });
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
  }, []);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: intentional context-menu wrapper
    <div
      className={cn("contents", className)}
      onContextMenu={handleContextMenu}
    >
      {children}
      <MenuPanel
        items={items}
        x={state.x}
        y={state.y}
        visible={state.visible}
        onClose={close}
      />
    </div>
  );
}

/* ─── Hook variant for imperative / table-row usage ─── */

interface OpenAtOptions {
  /** When true, y is treated as the bottom edge — menu grows upward */
  bottomAnchor?: boolean;
}

interface ContextMenuTrigger {
  /**
   * Call from onContextMenu handler.
   * Pass items dynamically so each row can have its own menu.
   */
  open: (e: React.MouseEvent, items: ContextMenuItem[]) => void;
  /** Open at explicit coordinates (e.g. anchored to an element). */
  openAt: (
    x: number,
    y: number,
    items: ContextMenuItem[],
    options?: OpenAtOptions,
  ) => void;
  /** Menu portal — render this once near the root of your component */
  contextMenu: ReactNode;
}

export function useContextMenu(): ContextMenuTrigger {
  const [state, setState] = useState<MenuState>({
    visible: false,
    x: 0,
    y: 0,
  });
  const [items, setItems] = useState<ContextMenuItem[]>([]);
  const [bottomAnchor, setBottomAnchor] = useState(false);

  const close = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
  }, []);

  const open = useCallback(
    (e: React.MouseEvent, nextItems: ContextMenuItem[]) => {
      e.preventDefault();
      e.stopPropagation();
      setItems(nextItems);
      setBottomAnchor(false);
      setState({ visible: true, x: e.clientX, y: e.clientY });
    },
    [],
  );

  const openAt = useCallback(
    (
      x: number,
      y: number,
      nextItems: ContextMenuItem[],
      options?: OpenAtOptions,
    ) => {
      setItems(nextItems);
      setBottomAnchor(options?.bottomAnchor ?? false);
      setState({ visible: true, x, y });
    },
    [],
  );

  const contextMenu = (
    <MenuPanel
      items={items}
      x={state.x}
      y={state.y}
      visible={state.visible}
      onClose={close}
      bottomAnchor={bottomAnchor}
    />
  );

  return { open, openAt, contextMenu };
}
