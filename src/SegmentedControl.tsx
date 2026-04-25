import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "./utils";

export interface SegmentedControlOption<
  T extends string | number | boolean = string,
> {
  label: React.ReactNode;
  value: T;
}

export interface SegmentedControlProps<
  T extends string | number | boolean = string,
> {
  value?: T;
  onChange?: (value: T) => void;
  options: SegmentedControlOption<T>[];
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string | number | boolean = string>({
  value,
  onChange,
  options,
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canAnimate = useRef(false);
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
  } | null>(null);

  // Stable fingerprint to recompute when option list changes
  const fingerprint = options.map((o) => String(o.value)).join("|");

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container || value === undefined) {
      setIndicator(null);
      return;
    }
    const target = container.querySelector<HTMLElement>(
      `[data-segmented-key="${String(value)}"]`,
    );
    if (!target) {
      setIndicator(null);
      return;
    }
    const left = target.offsetLeft;
    const width = target.offsetWidth;
    setIndicator((prev) =>
      prev && prev.left === left && prev.width === width
        ? prev
        : { left, width },
    );
  }, [value]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: fingerprint triggers recompute when options change
  useLayoutEffect(() => {
    measure();
  }, [measure, fingerprint]);

  // Re-measure when container itself resizes (parent width changes, etc.)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(container);
    return () => ro.disconnect();
  }, [measure]);

  // Enable slide animation after the initial positioning frame so the
  // indicator doesn't fly in from (0,0) on first paint.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      canAnimate.current = true;
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative inline-flex rounded-[7px] p-0.5",
        "bg-black/[0.07] dark:bg-white/[0.1]",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {indicator && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-0.5 bottom-0.5 z-0 rounded-[5px]",
            "bg-white dark:bg-white/[0.18]",
            "shadow-[0_1px_3px_rgba(0,0,0,0.14),0_0_0_0.5px_rgba(0,0,0,0.08)]",
            "dark:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_0.5px_rgba(255,255,255,0.06)]",
          )}
          style={{
            left: indicator.left,
            width: indicator.width,
            transition: canAnimate.current
              ? "left 200ms ease-out, width 200ms ease-out"
              : "none",
          }}
        />
      )}
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            data-segmented-key={String(opt.value)}
            className={cn(
              "relative z-10 flex-1 px-2.5 py-[5px] text-xs font-medium rounded-[5px] cursor-pointer whitespace-nowrap select-none text-center",
              "transition-colors duration-150",
              isActive
                ? "text-fg-primary"
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
