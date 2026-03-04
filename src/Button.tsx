import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "./utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: "primary" | "default" | "dashed" | "text" | "link" | "danger";
  /** Size */
  size?: "small" | "middle" | "large";
  /** Show loading spinner */
  loading?: boolean;
  /** Make the button full width */
  block?: boolean;
  /** Button shape */
  shape?: "default" | "circle" | "round";
  /** Icon placed before children */
  icon?: ReactNode;
  /** HTML submit type shortcut — maps to type="submit" */
  htmlType?: "button" | "submit" | "reset";
  /** Danger mode (can combine with variant) */
  danger?: boolean;
  /** Ref forwarding (React 19 style) */
  ref?: Ref<HTMLButtonElement>;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-sky-600 text-white hover:bg-sky-500 active:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 border-transparent shadow-sm",
  default:
    "bg-white text-slate-700 border-slate-300 hover:text-sky-600 hover:border-sky-500 active:text-sky-700 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:text-sky-400 dark:hover:border-sky-400",
  dashed:
    "bg-white text-slate-700 border-slate-300 border-dashed hover:text-sky-600 hover:border-sky-500 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:text-sky-400 dark:hover:border-sky-400",
  text: "bg-transparent text-slate-700 border-transparent hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/50 dark:border-transparent",
  link: "bg-transparent text-sky-600 border-transparent hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 p-0 h-auto",
  danger:
    "bg-white text-red-500 border-red-300 hover:text-red-600 hover:border-red-400 dark:bg-slate-800 dark:text-red-400 dark:border-red-500",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  small: "px-2 py-0.5 text-xs h-6",
  middle: "px-3 py-1 text-sm h-8",
  large: "px-4 py-1.5 text-base h-10",
};

export function Button({
  ref,
  variant = "default",
  size = "middle",
  loading = false,
  block = false,
  shape = "default",
  icon,
  htmlType = "button",
  className,
  disabled,
  children,
  type: _type,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const shapeClass =
    shape === "circle"
      ? "!rounded-full !px-0 aspect-square"
      : shape === "round"
        ? "rounded-full"
        : "rounded-md";

  return (
    <button
      ref={ref}
      type={htmlType}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 border font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 select-none",
        variantClasses[variant],
        variant !== "link" && sizeClasses[size],
        shapeClass,
        block && "w-full",
        isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : icon ? (
        <span className="inline-flex items-center justify-center shrink-0 [&>svg]:w-[1em] [&>svg]:h-[1em]">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}
