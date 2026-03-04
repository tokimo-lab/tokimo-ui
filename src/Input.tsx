import { Eye, EyeOff, Search } from "lucide-react";
import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
  useState,
} from "react";
import { cn } from "./utils";

/* ─── Base Input ─── */
export interface InputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "size" | "prefix" | "suffix"
  > {
  size?: "small" | "middle" | "large";
  /** Prefix icon/element */
  prefix?: ReactNode;
  /** Suffix icon/element */
  suffix?: ReactNode;
  /** Red border on error */
  status?: "error" | "warning";
  /** Allow clear button */
  allowClear?: boolean;
  /** Enter key handler */
  onPressEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const sizeMap = {
  small: "px-2 py-0.5 text-xs h-6",
  middle: "px-3 py-1.5 text-sm h-8",
  large: "px-3 py-2 text-base h-10",
};

const BaseInput = forwardRef<HTMLInputElement, InputProps>(
  ({ size = "middle", prefix, suffix, status, className, ...rest }, ref) => (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border bg-white transition-colors focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 dark:bg-slate-900",
        status === "error"
          ? "border-red-500"
          : status === "warning"
            ? "border-amber-500"
            : "border-slate-300 dark:border-slate-600",
        sizeMap[size],
        className,
      )}
    >
      {prefix ? (
        <span className="text-slate-400 shrink-0 [&>svg]:w-[1em] [&>svg]:h-[1em]">
          {prefix}
        </span>
      ) : null}
      <input
        ref={ref}
        className="w-full min-w-0 bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-inherit"
        {...rest}
      />
      {suffix ? (
        <span className="text-slate-400 shrink-0 [&>svg]:w-[1em] [&>svg]:h-[1em]">
          {suffix}
        </span>
      ) : null}
    </div>
  ),
);
BaseInput.displayName = "Input";

/* ─── Password ─── */
export interface PasswordProps extends Omit<InputProps, "type" | "suffix"> {
  /** Visibility toggle config (antd compat) */
  visibilityToggle?:
    | boolean
    | { visible?: boolean; onVisibleChange?: (visible: boolean) => void };
  /** Custom icon render (antd compat) */
  iconRender?: (visible: boolean) => ReactNode;
}

export const Password = forwardRef<HTMLInputElement, PasswordProps>(
  (props, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <BaseInput
        ref={ref}
        type={visible ? "text" : "password"}
        suffix={
          <button
            type="button"
            tabIndex={-1}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        }
        {...props}
      />
    );
  },
);
Password.displayName = "Password";

/* ─── TextArea ─── */
export interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  size?: "small" | "middle" | "large";
  status?: "error" | "warning";
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ size = "middle", status, className, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-md border bg-white transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none placeholder:text-slate-400 dark:bg-slate-900 dark:placeholder:text-slate-500",
        status === "error"
          ? "border-red-500"
          : status === "warning"
            ? "border-amber-500"
            : "border-slate-300 dark:border-slate-600",
        size === "small"
          ? "px-2 py-1 text-xs"
          : size === "large"
            ? "px-3 py-2 text-base"
            : "px-3 py-1.5 text-sm",
        className,
      )}
      {...rest}
    />
  ),
);
TextArea.displayName = "TextArea";

/* ─── SearchInput ─── */
export interface SearchInputProps extends Omit<InputProps, "suffix"> {
  onSearch?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, onKeyDown, ...rest }, ref) => (
    <BaseInput
      ref={ref}
      suffix={<Search className="h-4 w-4" />}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onSearch?.((e.target as HTMLInputElement).value);
        }
        onKeyDown?.(e);
      }}
      {...rest}
    />
  ),
);
SearchInput.displayName = "SearchInput";

function InputGroup({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex", className)}>{children}</div>;
}

export const Input = Object.assign(BaseInput, {
  Password,
  TextArea,
  Group: InputGroup,
});
