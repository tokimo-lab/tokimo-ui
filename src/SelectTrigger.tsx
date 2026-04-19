/**
 * SelectTrigger — A standalone, styled trigger button that matches
 * `<Select>` visually (same border/padding/ring/size), but lets callers
 * render arbitrary content inside and manage their own dropdown.
 *
 * Use this when your dropdown is too complex for `<Select>` (e.g. grouped
 * options with rich per-row content, custom search, async loading) but
 * you still want the trigger to look identical to Select across the app.
 *
 * Pair it with `<Popover>` or Floating UI directly:
 *
 *   <Popover trigger="click" content={<MyDropdown/>}>
 *     <SelectTrigger open={open}>
 *       <Icon/> <span>Selected value</span>
 *     </SelectTrigger>
 *   </Popover>
 */

import { ChevronDown } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";
import { selectTriggerClassName } from "./Select";
import { cn } from "./utils";

export interface SelectTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  size?: "small" | "middle" | "large";
  status?: "error" | "warning";
  /** Whether the associated dropdown is open (drives border ring & chevron). */
  open?: boolean;
  /** Hide the trailing chevron (default: show). */
  hideChevron?: boolean;
  /** Trigger display content (icon + label). */
  children?: ReactNode;
}

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  function SelectTrigger(
    {
      size = "middle",
      status,
      disabled,
      open,
      hideChevron,
      className,
      children,
      type = "button",
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          "group",
          selectTriggerClassName({
            size,
            status,
            disabled,
            open,
            className,
          }),
        )}
        {...rest}
      >
        <div className="flex-1 flex items-center gap-1.5 overflow-hidden min-w-0">
          {children}
        </div>
        {!hideChevron && (
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] transition-transform",
              "group-data-[open=true]:rotate-180",
              open && "rotate-180",
            )}
          />
        )}
      </button>
    );
  },
);
