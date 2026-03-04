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

export interface DropdownMenuItem {
  key?: string;
  label?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  type?: "divider" | "group";
  children?: DropdownMenuItem[];
  onClick?: () => void;
}

export interface DropdownMenuConfig {
  items: DropdownMenuItem[];
  onClick?: (info: { key: string }) => void;
}

export interface DropdownProps {
  /** Menu config */
  menu?: DropdownMenuConfig;
  /** Trigger mode */
  trigger?: Array<"click" | "hover" | "contextMenu">;
  /** Placement */
  placement?:
    | Placement
    | "bottomLeft"
    | "bottomRight"
    | "topLeft"
    | "topRight"
    | "bottomCenter"
    | "topCenter";
  /** Trigger element */
  children: ReactElement;
  /** Custom dropdown content instead of menu */
  dropdownRender?: (menu: ReactNode) => ReactNode;
  /** Open state controlled */
  open?: boolean;
  /** Open change callback */
  onOpenChange?: (open: boolean) => void;
  /** Disabled */
  disabled?: boolean;
  /** Arrow */
  arrow?: boolean;
  /** Class names (antd v5 compat) */
  classNames?: { root?: string };
}

function MenuList({
  items,
  onClick,
  onClose,
}: {
  items: DropdownMenuItem[];
  onClick?: (info: { key: string }) => void;
  onClose: () => void;
}) {
  return (
    <div className="py-1 min-w-[120px]">
      {items.map((item, i) => {
        if (item.type === "divider") {
          return (
            <div
              key={item.key || `d-${i}`}
              className="my-1 h-px bg-slate-200 dark:bg-slate-700"
            />
          );
        }
        return (
          <button
            key={item.key ?? `item-${i}`}
            type="button"
            disabled={item.disabled}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors",
              item.danger
                ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
              item.disabled && "opacity-50 cursor-not-allowed",
            )}
            onClick={() => {
              if (item.disabled) return;
              item.onClick?.();
              onClick?.({ key: item.key ?? "" });
              onClose();
            }}
          >
            {item.icon ? (
              <span className="shrink-0 inline-flex">{item.icon}</span>
            ) : null}
            <span className="flex-1">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Dropdown({
  menu,
  trigger = ["hover"],
  placement: placementProp = "bottom-start",
  children,
  dropdownRender,
  open: openProp,
  onOpenChange,
  disabled = false,
  arrow: _arrow = false,
}: DropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = (v: boolean) => {
    if (!isControlled) setUncontrolledOpen(v);
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
    middleware: [offset(4), flip(), shift({ padding: 5 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context, {
    enabled: trigger.includes("click") && !disabled,
  });
  const hover = useHover(context, {
    enabled: trigger.includes("hover") && !disabled,
    delay: { open: 75, close: 150 },
  });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "menu" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    hover,
    dismiss,
    role,
  ]);

  const menuContent = menu ? (
    <MenuList
      items={menu.items}
      onClick={menu.onClick}
      onClose={() => setOpen(false)}
    />
  ) : null;

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
              "z-[9999] rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg",
            )}
            {...getFloatingProps()}
          >
            {dropdownRender ? dropdownRender(menuContent) : menuContent}
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
}
