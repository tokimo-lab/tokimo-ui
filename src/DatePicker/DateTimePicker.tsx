import {
  autoUpdate,
  FloatingPortal,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { CalendarDays, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FloatingVibrancy } from "../FloatingVibrancy";
import { useLocale } from "../locale";
import { cn } from "../utils";
import { CalendarPanel } from "./CalendarPanel";
import { TimePanel } from "./TimePanel";
import { formatDate, parseDate } from "./utils";

export interface DateTimePickerProps {
  /** Selected date-time */
  value?: Date | null;
  /** Default date-time */
  defaultValue?: Date | null;
  /** Change callback — receives Date and formatted string */
  onChange?: (dateTime: Date | null, dateTimeString: string) => void;
  /** Display format (default: "YYYY-MM-DD HH:mm:ss") */
  format?: string;
  /** Show seconds column (default: true) */
  showSecond?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  size?: "small" | "middle" | "large";
  status?: "error" | "warning";
  className?: string;
  style?: React.CSSProperties;
  /** Disable specific dates */
  disabledDate?: (date: Date) => boolean;
  /** Controlled open state */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const sizeMap = {
  small: "h-6 text-xs px-2",
  middle: "h-8 text-sm px-3",
  large: "h-10 text-base px-3",
};

export function DateTimePicker({
  value: valueProp,
  defaultValue,
  onChange,
  format: formatProp,
  showSecond = true,
  hourStep = 1,
  minuteStep = 1,
  secondStep = 1,
  placeholder: placeholderProp,
  allowClear = false,
  disabled = false,
  size = "middle",
  status,
  className,
  style,
  disabledDate,
  open: openProp,
  onOpenChange,
}: DateTimePickerProps) {
  const locale = useLocale().DatePicker;
  const placeholder = placeholderProp ?? locale.dateTimePlaceholder;
  const format =
    formatProp ?? (showSecond ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD HH:mm");

  const [internalValue, setInternalValue] = useState<Date | null>(
    defaultValue ?? null,
  );
  const value = valueProp !== undefined ? valueProp : internalValue;

  const [workingDate, setWorkingDate] = useState<Date>(value ?? new Date());

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = openProp ?? uncontrolledOpen;
  const setOpen = (v: boolean) => {
    if (disabled) return;
    if (openProp === undefined) setUncontrolledOpen(v);
    onOpenChange?.(v);
    if (v) {
      setWorkingDate(value ? new Date(value) : new Date());
    }
  };

  const [inputValue, setInputValue] = useState(
    value ? formatDate(value, format) : "",
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value ? formatDate(value, format) : "");
  }, [value, format]);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setOpen,
    placement: "bottom-start",
    middleware: [offset(4), flip(), shift({ padding: 5 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context, { enabled: !disabled });
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const commitValue = (date: Date | null) => {
    if (valueProp === undefined) setInternalValue(date);
    onChange?.(date, date ? formatDate(date, format) : "");
  };

  const handleDateSelect = (date: Date) => {
    date.setHours(
      workingDate.getHours(),
      workingDate.getMinutes(),
      workingDate.getSeconds(),
    );
    const next = new Date(date);
    setWorkingDate(next);
    commitValue(next);
  };

  const handleTimeChange = (date: Date) => {
    const next = new Date(date);
    setWorkingDate(next);
    commitValue(next);
  };

  const handleNow = () => {
    const now = new Date();
    setWorkingDate(now);
    commitValue(now);
    setOpen(false);
  };

  const handleOk = () => {
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    commitValue(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    if (inputValue === "") {
      if (value) commitValue(null);
      return;
    }
    const parsed = parseDate(inputValue, format);
    if (parsed && !disabledDate?.(parsed)) {
      commitValue(parsed);
    } else {
      setInputValue(value ? formatDate(value, format) : "");
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      handleInputBlur();
      setOpen(false);
    }
    if (e.key === "Escape") {
      setInputValue(value ? formatDate(value, format) : "");
      setOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  return (
    <>
      <div
        ref={refs.setReference}
        className={cn(
          "inline-flex items-center gap-2 rounded-md border bg-[var(--input-bg)] transition-colors",
          isOpen
            ? "border-[var(--accent)] ring-1 ring-[var(--accent)]"
            : status === "error"
              ? "border-red-500"
              : status === "warning"
                ? "border-amber-500"
                : "border-black/[0.08] dark:border-white/[0.1]",
          disabled &&
            "opacity-50 cursor-not-allowed bg-black/[0.02] dark:bg-white/[0.02]",
          sizeMap[size],
          className,
        )}
        style={style}
        {...getReferenceProps()}
      >
        <input
          ref={inputRef}
          className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-[var(--text-muted)] text-inherit"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
        />
        {allowClear && value && !disabled ? (
          <button
            type="button"
            className="shrink-0 cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            onClick={handleClear}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
        )}
      </div>

      {isOpen ? (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              backdropFilter: "blur(var(--window-blur, 24px))",
              WebkitBackdropFilter: "blur(var(--window-blur, 24px))",
              borderRadius: "var(--window-radius, 8px)",
            }}
            className="z-[9999] bg-[rgba(255,255,255,calc(var(--window-opacity,85)/100))] dark:bg-[rgba(15,15,25,calc(var(--window-opacity,85)/100))] border border-black/[0.06] dark:border-white/[0.08] shadow-lg overflow-hidden"
            {...getFloatingProps()}
          >
            <FloatingVibrancy />
            <div className="relative">
              <div className="flex">
                <div className="border-r border-black/[0.06] dark:border-white/[0.08]">
                  <CalendarPanel
                    value={workingDate}
                    onSelect={handleDateSelect}
                    disabledDate={disabledDate}
                    showToday={false}
                  />
                </div>
                <TimePanel
                  value={workingDate}
                  onChange={handleTimeChange}
                  showSecond={showSecond}
                  hourStep={hourStep}
                  minuteStep={minuteStep}
                  secondStep={secondStep}
                  showNow={false}
                  showOk={false}
                />
              </div>
              <div className="flex items-center justify-between border-t border-black/[0.06] dark:border-white/[0.08] px-3 py-1.5">
                <button
                  type="button"
                  className="text-xs text-[var(--accent)] cursor-pointer hover:text-[var(--accent-hover)] transition-colors"
                  onClick={handleNow}
                >
                  {locale.now}
                </button>
                <button
                  type="button"
                  className="text-xs px-3 py-0.5 rounded bg-[var(--accent)] text-white cursor-pointer hover:bg-[var(--accent-hover)] transition-colors"
                  onClick={handleOk}
                >
                  {locale.ok}
                </button>
              </div>
            </div>
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
}
