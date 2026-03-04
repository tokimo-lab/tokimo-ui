import {
  FloatingPortal,
  flip,
  offset,
  size,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import { X as XIcon } from "lucide-react";
import {
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "./utils";

export interface AutoCompleteOption {
  value: string;
  label?: ReactNode;
  disabled?: boolean;
}

export interface AutoCompleteProps {
  /** Options (strings or option objects) */
  options?: (string | AutoCompleteOption)[];
  /** Controlled value */
  value?: string;
  /** Default value */
  defaultValue?: string;
  /** On change (user types or selects) */
  onChange?: (value: string) => void;
  /** On select from dropdown */
  onSelect?: (value: string, option: AutoCompleteOption) => void;
  /** Custom filter (return true to keep) */
  filterOption?:
    | boolean
    | ((inputValue: string, option: AutoCompleteOption) => boolean);
  /** Placeholder */
  placeholder?: string;
  /** Disabled */
  disabled?: boolean;
  /** Allow clear */
  allowClear?: boolean;
  /** Size */
  size?: "small" | "middle" | "large";
  /** Status */
  status?: "error" | "warning";
  /** Auto focus */
  autoFocus?: boolean;
  /** On blur */
  onBlur?: () => void;
  /** On focus */
  onFocus?: () => void;
  /** Not found content */
  notFoundContent?: ReactNode;
  /** ClassName */
  className?: string;
  /** Style */
  style?: React.CSSProperties;
  /** Custom children input */
  children?: ReactNode;
  /** On search (typing) */
  onSearch?: (value: string) => void;
  /** Back fill selected value */
  backfill?: boolean;
  /** Custom dropdown render (antd compat) */
  dropdownRender?: (menu: ReactNode) => ReactNode;
  /** Keyboard event handler */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const AutoComplete = forwardRef<HTMLDivElement, AutoCompleteProps>(
  function AutoComplete(
    {
      options: rawOptions = [],
      value: controlledVal,
      defaultValue = "",
      onChange,
      onSelect,
      filterOption = true,
      placeholder,
      disabled = false,
      allowClear = false,
      size: sz = "middle",
      status,
      autoFocus: _autoFocus,
      onBlur,
      onFocus,
      notFoundContent,
      className,
      style,
      children: _children,
      onSearch,
      backfill = false,
      onKeyDown: onKeyDownProp,
    },
    ref,
  ) {
    const [internal, setInternal] = useState(defaultValue);
    const val = controlledVal ?? internal;
    const [open, setOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);

    const normalised: AutoCompleteOption[] = useMemo(
      () =>
        rawOptions.map((o) =>
          typeof o === "string" ? { value: o, label: o } : o,
        ),
      [rawOptions],
    );

    const filtered = useMemo(() => {
      if (filterOption === false) return normalised;
      const fn =
        typeof filterOption === "function"
          ? filterOption
          : (input: string, opt: AutoCompleteOption) =>
              opt.value.toLowerCase().includes(input.toLowerCase());
      return normalised.filter((o) => fn(val, o));
    }, [normalised, val, filterOption]);

    const { refs, floatingStyles, context } = useFloating({
      open,
      onOpenChange: setOpen,
      placement: "bottom-start",
      middleware: [
        offset(4),
        flip(),
        size({
          apply({ rects, elements }) {
            Object.assign(elements.floating.style, {
              minWidth: `${rects.reference.width}px`,
            });
          },
        }),
      ],
    });

    const dismiss = useDismiss(context);
    const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

    const updateVal = useCallback(
      (v: string) => {
        setInternal(v);
        onChange?.(v);
      },
      [onChange],
    );

    const handleSelect = useCallback(
      (opt: AutoCompleteOption) => {
        updateVal(opt.value);
        onSelect?.(opt.value, opt);
        setOpen(false);
        inputRef.current?.focus();
      },
      [updateVal, onSelect],
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!open && e.key === "ArrowDown") {
        setOpen(true);
        return;
      }
      if (!open) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = activeIdx < filtered.length - 1 ? activeIdx + 1 : 0;
        setActiveIdx(next);
        if (backfill) updateVal(filtered[next].value);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = activeIdx > 0 ? activeIdx - 1 : filtered.length - 1;
        setActiveIdx(prev);
        if (backfill) updateVal(filtered[prev].value);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeIdx >= 0 && activeIdx < filtered.length) {
          handleSelect(filtered[activeIdx]);
        }
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };

    useEffect(() => {
      setActiveIdx(-1);
    }, []);

    const sizeClass = {
      small: "text-xs px-2",
      middle: "text-sm px-3",
      large: "text-base px-3",
    }[sz];

    const wrapperSizeClass = {
      small: "h-6",
      middle: "h-8",
      large: "h-10",
    }[sz];

    const borderClass = status
      ? status === "error"
        ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20"
        : "border-amber-500 focus-within:border-amber-500 focus-within:ring-amber-500/20"
      : "border-slate-300 dark:border-slate-600 focus-within:border-sky-500 focus-within:ring-sky-500/20";

    return (
      <div
        ref={ref}
        className={cn("relative inline-block", className)}
        style={style}
      >
        <div
          ref={refs.setReference}
          {...getReferenceProps()}
          className={cn(
            "flex items-center rounded-md border transition-colors focus-within:ring-2",
            wrapperSizeClass,
            borderClass,
            disabled &&
              "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900",
          )}
        >
          <input
            ref={inputRef}
            type="text"
            className={cn(
              "flex-1 min-w-0 bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400",
              sizeClass,
              disabled && "cursor-not-allowed",
            )}
            value={val}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(e) => {
              updateVal(e.target.value);
              onSearch?.(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => {
              if (!disabled) setOpen(true);
              onFocus?.();
            }}
            onBlur={() => {
              onBlur?.();
            }}
            onKeyDown={(e) => {
              handleKeyDown(e);
              onKeyDownProp?.(e);
            }}
          />
          {allowClear && val ? (
            <button
              type="button"
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                updateVal("");
                inputRef.current?.focus();
              }}
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        {open && filtered.length > 0 && (
          <FloatingPortal>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-[1050] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 max-h-64 overflow-auto"
            >
              {filtered.map((opt, i) => (
                <div
                  key={opt.value}
                  role="option"
                  tabIndex={0}
                  className={cn(
                    "px-3 py-1.5 text-sm cursor-pointer select-none transition-colors",
                    i === activeIdx
                      ? "bg-sky-50 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60",
                    opt.disabled && "opacity-40 cursor-not-allowed",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (!opt.disabled) handleSelect(opt);
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !opt.disabled)
                      handleSelect(opt);
                  }}
                  onMouseEnter={() => setActiveIdx(i)}
                >
                  {opt.label ?? opt.value}
                </div>
              ))}
            </div>
          </FloatingPortal>
        )}
        {open && filtered.length === 0 && notFoundContent && (
          <FloatingPortal>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-[1050] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-4 px-3 text-center text-sm text-slate-400"
            >
              {notFoundContent}
            </div>
          </FloatingPortal>
        )}
      </div>
    );
  },
);
