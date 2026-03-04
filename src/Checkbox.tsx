import { Check } from "lucide-react";
import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
  useState,
} from "react";
import { cn } from "./utils";

export interface CheckboxProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange" | "value"
  > {
  /** Whether checked */
  checked?: boolean;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Label text */
  children?: ReactNode;
  /** Indeterminate state */
  indeterminate?: boolean;
  /** Value alias for form compat */
  value?: boolean;
}

const BaseCheckbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked: checkedProp,
      onChange,
      disabled,
      children,
      indeterminate = false,
      className,
      id: idProp,
      value,
      ...rest
    },
    ref,
  ) => {
    const autoId = useId();
    const id = idProp ?? autoId;
    const isChecked = checkedProp ?? value ?? false;

    return (
      <label
        htmlFor={id}
        className={cn(
          "inline-flex items-center gap-2 cursor-pointer select-none",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
      >
        <span className="relative">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            checked={isChecked}
            disabled={disabled}
            onChange={onChange}
            className="sr-only peer"
            {...rest}
          />
          <span
            className={cn(
              "flex items-center justify-center h-4 w-4 rounded border transition-colors",
              isChecked || indeterminate
                ? "bg-sky-500 border-sky-500 text-white dark:bg-sky-600 dark:border-sky-600"
                : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800",
              !disabled &&
                "peer-focus-visible:ring-2 peer-focus-visible:ring-sky-500 peer-focus-visible:ring-offset-1",
            )}
          >
            {indeterminate ? (
              <span className="h-0.5 w-2 bg-white rounded" />
            ) : isChecked ? (
              <Check className="h-3 w-3" strokeWidth={3} />
            ) : null}
          </span>
        </span>
        {children ? (
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {children}
          </span>
        ) : null}
      </label>
    );
  },
);
BaseCheckbox.displayName = "Checkbox";

/* ─── Checkbox.Group ─── */
export interface CheckboxGroupOption {
  label: ReactNode;
  value: string | number;
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  options?: CheckboxGroupOption[];
  value?: (string | number)[];
  defaultValue?: (string | number)[];
  onChange?: (values: (string | number)[]) => void;
  disabled?: boolean;
  className?: string;
}

function CheckboxGroup({
  options = [],
  value: valueProp,
  defaultValue = [],
  onChange,
  disabled,
  className,
}: CheckboxGroupProps) {
  const [internal, setInternal] = useState<(string | number)[]>(defaultValue);
  const value = valueProp ?? internal;

  const toggle = (optVal: string | number) => {
    const next = value.includes(optVal)
      ? value.filter((v) => v !== optVal)
      : [...value, optVal];
    if (valueProp === undefined) setInternal(next);
    onChange?.(next);
  };

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {options.map((opt) => (
        <label
          key={String(opt.value)}
          className={cn(
            "inline-flex items-center gap-2 cursor-pointer select-none text-sm",
            (disabled || opt.disabled) && "opacity-50 cursor-not-allowed",
          )}
        >
          <span className="relative">
            <input
              type="checkbox"
              checked={value.includes(opt.value)}
              disabled={disabled || opt.disabled}
              onChange={() => toggle(opt.value)}
              className="sr-only peer"
            />
            <span
              className={cn(
                "flex items-center justify-center h-4 w-4 rounded border transition-colors",
                value.includes(opt.value)
                  ? "bg-sky-500 border-sky-500 text-white dark:bg-sky-600 dark:border-sky-600"
                  : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800",
                !(disabled || opt.disabled) &&
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-sky-500 peer-focus-visible:ring-offset-1",
              )}
            >
              {value.includes(opt.value) ? (
                <Check className="h-3 w-3" strokeWidth={3} />
              ) : null}
            </span>
          </span>
          <span className="text-slate-700 dark:text-slate-300">
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );
}

export const Checkbox = Object.assign(BaseCheckbox, {
  Group: CheckboxGroup,
});
