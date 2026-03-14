import {
  autoUpdate,
  FloatingPortal,
  flip,
  offset,
  type Placement,
  shift,
  useClick,
  useDismiss,
  useFloating,
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

export interface PopoverProps {
  /** Popover title */
  title?: ReactNode;
  /** Popover body content */
  content?: ReactNode;
  /** Placement */
  placement?:
    | Placement
    | "bottomLeft"
    | "bottomRight"
    | "topLeft"
    | "topRight"
    | "bottomCenter"
    | "topCenter";
  /** Trigger mode */
  trigger?: "click" | "hover";
  /** Trigger element */
  children: ReactElement;
  /** Open state controlled */
  open?: boolean;
  /** Open change callback */
  onOpenChange?: (open: boolean) => void;
}

export function Popover({
  title,
  content,
  placement: placementProp = "top",
  trigger = "hover",
  children,
  open: openProp,
  onOpenChange,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = (v: boolean) => {
    if (openProp === undefined) setUncontrolledOpen(v);
    onOpenChange?.(v);
  };

  const placementMap: Record<string, Placement> = {
    bottomLeft: "bottom-start",
    bottomRight: "bottom-end",
    topLeft: "top-start",
    topRight: "top-end",
    bottomCenter: "bottom",
    topCenter: "top",
  };
  const placement = (placementMap[placementProp] ?? placementProp) as Placement;

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    middleware: [offset(6), flip(), shift({ padding: 5 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context, { enabled: trigger === "click" });
  const hover = useHover(context, {
    enabled: trigger === "hover",
    delay: { open: 75, close: 150 },
  });
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    hover,
    dismiss,
    role,
  ]);

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
              "z-[9999] rounded-lg bg-white/90 dark:bg-[rgba(15,15,25,0.9)] backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-lg p-3 max-w-xs",
            )}
            {...getFloatingProps()}
          >
            {title ? (
              <div className="font-medium text-sm text-[var(--text-primary)] mb-2">
                {title}
              </div>
            ) : null}
            {content ? (
              <div className="text-sm text-[var(--text-secondary)]">
                {content}
              </div>
            ) : null}
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
}
