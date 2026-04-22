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
import { useDateFormatOrNull } from "../dateFormat";
import { FloatingVibrancy } from "../FloatingVibrancy";
import { useLocale } from "../locale";
import { cn } from "../utils";
import { CalendarPanel } from "./CalendarPanel";
import { formatDate, parseDate } from "./utils";

export interface DatePickerProps {
  /** Selected date */
  value?: Date | null;
  /** Default date */
  defaultValue?: Date | null;
  /** Change callback — receives Date and formatted string */
  onChange?: (date: Date | null, dateString: string) => void;
  /** Display format. Defaults to `useDateFormat()?.dateFormat ?? "YYYY-MM-DD"`. */
  format?: string;
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

export function DatePicker({
  value: valueProp,
  defaultValue,
  onChange,
  format: formatProp,
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
}: DatePickerProps) {
  const locale = useLocale().DatePicker;
  const dateCtx = useDateFormatOrNull();
  const format = formatProp ?? dateCtx?.dateFormat ?? "YYYY-MM-DD";
  const placeholder = placeholderProp ?? locale.datePlaceholder;
  const [internalValue, setInternalValue] = useState<Date | null>(
    defaultValue ?? null,
  );
  const value = valueProp !== undefined ? valueProp : internalValue;

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = openProp ?? uncontrolledOpen;
  const setOpen = (v: boolean) => {
    if (disabled) return;
    if (openProp === undefined) setUncontrolledOpen(v);
    onOpenChange?.(v);
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

  const handleSelect = (date: Date) => {
    if (value) {
      date.setHours(value.getHours(), value.getMinutes(), value.getSeconds());
    }
    commitValue(date);
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

  const handleToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    handleSelect(today);
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
              <CalendarPanel
                value={value}
                onSelect={handleSelect}
                disabledDate={disabledDate}
                onToday={handleToday}
              />
            </div>
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
}
