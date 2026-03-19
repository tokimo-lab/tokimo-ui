import {
  autoUpdate,
  FloatingPortal,
  flip,
  offset,
  type Placement,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useState,
} from "react";
import { cn } from "./utils";

export interface TooltipProps {
  /** Tooltip content */
  title?: ReactNode;
  /** Placement */
  placement?: Placement;
  /** Trigger element */
  children: ReactElement;
  /** Open state (controlled) */
  open?: boolean;
  /** Color preset */
  color?: string;
  /** Mouse enter delay (ms) */
  mouseEnterDelay?: number;
  /** Mouse leave delay (ms) */
  mouseLeaveDelay?: number;
}

export function Tooltip({
  title,
  placement = "top",
  children,
  open: openProp,
  color,
  mouseEnterDelay = 100,
  mouseLeaveDelay = 100,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const open = openProp ?? isOpen;

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: openProp === undefined ? setIsOpen : undefined,
    placement,
    middleware: [offset(6), flip(), shift({ padding: 5 })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    delay: { open: mouseEnterDelay, close: mouseLeaveDelay },
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  if (!title) return <>{children}</>;

  return (
    <>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<Record<string, unknown>>, {
            ref: refs.setReference,
            ...getReferenceProps(),
          })
        : children}
      {open ? (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={cn(
              "z-[9999] max-w-xs break-all rounded px-2 py-1 text-xs shadow-lg",
              color
                ? color
                : "bg-slate-800 text-white dark:bg-white/10 dark:text-slate-100 backdrop-blur-xl",
            )}
            {...getFloatingProps()}
          >
            {title}
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
}
