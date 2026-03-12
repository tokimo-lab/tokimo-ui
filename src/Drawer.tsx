import { X } from "lucide-react";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "./utils";

export interface DrawerProps {
  /** Whether visible */
  open?: boolean;
  /** Title */
  title?: ReactNode;
  /** Placement */
  placement?: "left" | "right" | "top" | "bottom";
  /** Width (for left/right) */
  width?: number | string;
  /** Height (for top/bottom) */
  height?: number | string;
  /** Close callback */
  onClose?: () => void;
  /** Close on mask click */
  maskClosable?: boolean;
  /** Closable */
  closable?: boolean;
  /** Z index */
  zIndex?: number;
  /** Keyboard closable */
  keyboard?: boolean;
  /** Extra content in header */
  extra?: ReactNode;
  /** Custom footer */
  footer?: ReactNode;
  /** Body style */
  bodyStyle?: CSSProperties;
  /** Ant Design v5 styles API */
  styles?: {
    body?: CSSProperties;
    wrapper?: CSSProperties;
    header?: CSSProperties;
    root?: CSSProperties;
  };
  /** Destroy on close */
  destroyOnClose?: boolean;
  className?: string;
  children?: ReactNode;
}

const DURATION = 300;

const slideTransforms: Record<string, { hidden: string; visible: string }> = {
  left: { hidden: "translateX(-100%)", visible: "translateX(0)" },
  right: { hidden: "translateX(100%)", visible: "translateX(0)" },
  top: { hidden: "translateY(-100%)", visible: "translateY(0)" },
  bottom: { hidden: "translateY(100%)", visible: "translateY(0)" },
};

export function Drawer({
  open = false,
  title,
  placement = "right",
  width = 378,
  height = 378,
  onClose,
  maskClosable = true,
  closable = true,
  zIndex = 1000,
  keyboard = true,
  extra,
  footer,
  bodyStyle,
  styles,
  destroyOnClose = false,
  className,
  children,
}: DrawerProps) {
  // mounted: whether the DOM is rendered
  // visible: whether the enter animation is active
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef(0);

  // Open: mount first, then trigger enter animation on next frame
  useEffect(() => {
    if (open) {
      setMounted(true);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else {
      setVisible(false);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [open]);

  // After exit animation finishes, unmount
  const handleTransitionEnd = useCallback(() => {
    if (!open) {
      setMounted(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !keyboard) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, keyboard, onClose]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  if (!mounted && destroyOnClose) return null;
  if (!mounted) return null;

  const isHorizontal = placement === "left" || placement === "right";

  const slide = slideTransforms[placement];

  const panelStyle: CSSProperties = {
    ...(isHorizontal ? { width, height: "100%" } : { height, width: "100%" }),
    transform: visible ? slide.visible : slide.hidden,
    transition: `transform ${DURATION}ms cubic-bezier(0.2, 0, 0, 1)`,
  };

  const positionClass = {
    left: "left-0 top-0",
    right: "right-0 top-0",
    top: "top-0 left-0",
    bottom: "bottom-0 left-0",
  }[placement];

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex }}>
      {/* Mask */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: overlay mask click-to-dismiss */}
      <div
        className="absolute inset-0 bg-black/45"
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity ${DURATION}ms ease`,
        }}
        role="presentation"
        onClick={maskClosable ? onClose : undefined}
      />
      {/* Panel */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: dialog panel stopPropagation */}
      <div
        className={cn(
          "absolute bg-white dark:bg-slate-900 shadow-2xl flex flex-col",
          positionClass,
          className,
        )}
        style={{ ...panelStyle, ...styles?.wrapper }}
        role="presentation"
        onClick={(e) => e.stopPropagation()}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Header */}
        {(title || closable) && (
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0"
            style={styles?.header}
          >
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 m-0">
              {title}
            </h3>
            <div className="flex items-center gap-2">
              {extra}
              {closable ? (
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </button>
              ) : null}
            </div>
          </div>
        )}
        {/* Body */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(128,128,128,0.4) transparent",
            ...bodyStyle,
            ...styles?.body,
          }}
        >
          {children}
        </div>
        {/* Footer */}
        {footer ? (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
