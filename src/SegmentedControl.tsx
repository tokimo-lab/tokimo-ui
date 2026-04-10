import { cn } from "./utils";

export interface SegmentedControlOption<T extends string | number = string> {
  label: React.ReactNode;
  value: T;
}

export interface SegmentedControlProps<T extends string | number = string> {
  value?: T;
  onChange?: (value: T) => void;
  options: SegmentedControlOption<T>[];
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string | number = string>({
  value,
  onChange,
  options,
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex rounded-[7px] p-0.5",
        "bg-black/[0.07] dark:bg-white/[0.1]",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            className={cn(
              "relative px-2.5 py-[5px] text-xs font-medium rounded-[5px] cursor-pointer whitespace-nowrap select-none",
              "transition-[background,box-shadow,color] duration-150",
              isActive
                ? "bg-white dark:bg-white/[0.18] text-fg-primary shadow-[0_1px_3px_rgba(0,0,0,0.14),0_0_0_0.5px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_0.5px_rgba(255,255,255,0.06)]"
                : "text-fg-muted hover:text-fg-secondary",
            )}
            onClick={() => onChange?.(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
