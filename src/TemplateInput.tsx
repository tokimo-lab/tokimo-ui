import {
  autoUpdate,
  FloatingPortal,
  flip,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import {
  type ChangeEvent,
  forwardRef,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "./utils";

export interface TemplateVariable {
  /** Variable key (used in {{key}}) */
  key: string;
  /** Display label shown in dropdown */
  label: string;
}

export interface TemplateInputProps {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  /** Available template variables for autocomplete */
  vars: TemplateVariable[];
  /** Trigger string that opens autocomplete (default: "{{") */
  trigger?: string;
  /** Disabled state */
  disabled?: boolean;
}

export const TemplateInput = forwardRef<HTMLInputElement, TemplateInputProps>(
  (
    {
      value = "",
      onChange,
      placeholder,
      className,
      vars,
      trigger = "{{",
      disabled,
    },
    _ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(0);
    const [triggerPos, setTriggerPos] = useState(-1);

    const closeTrigger = trigger === "{{" ? "}}" : trigger;

    // Virtual reference element at the trigger cursor position
    const virtualRef = useRef<{ getBoundingClientRect: () => DOMRect }>({
      getBoundingClientRect: () => new DOMRect(0, 0, 0, 0),
    });

    const { refs, floatingStyles } = useFloating({
      open,
      onOpenChange: setOpen,
      placement: "bottom-start",
      middleware: [offset(4), flip(), shift({ padding: 8 })],
      whileElementsMounted: autoUpdate,
    });

    function updateVirtualPosition(charIdx: number) {
      const input = inputRef.current;
      if (!input) return;

      const mirror = document.createElement("span");
      const style = getComputedStyle(input);
      mirror.style.font = style.font;
      mirror.style.letterSpacing = style.letterSpacing;
      mirror.style.whiteSpace = "pre";
      mirror.style.position = "absolute";
      mirror.style.visibility = "hidden";
      mirror.textContent = input.value.slice(0, charIdx);
      document.body.appendChild(mirror);

      const textWidth = mirror.offsetWidth;
      document.body.removeChild(mirror);

      const inputRect = input.getBoundingClientRect();
      const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
      const left = inputRect.left + paddingLeft + textWidth - input.scrollLeft;

      virtualRef.current = {
        getBoundingClientRect: () =>
          new DOMRect(left, inputRect.top, 0, inputRect.height),
      };
      refs.setReference(virtualRef.current);
    }

    function getCursor() {
      return inputRef.current?.selectionStart ?? value.length;
    }

    const query =
      triggerPos >= 0
        ? value.slice(triggerPos + trigger.length, getCursor())
        : "";
    const filtered = vars.filter((v) =>
      v.key.toLowerCase().startsWith(query.toLowerCase()),
    );

    // Scroll active item into view
    useEffect(() => {
      if (!open || !listRef.current) return;
      const activeEl = listRef.current.children[activeIdx] as
        | HTMLElement
        | undefined;
      activeEl?.scrollIntoView({ block: "nearest" });
    }, [activeIdx, open]);

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
      onChange?.(e);
      const val = e.target.value;
      const cursor = e.target.selectionStart ?? val.length;

      const before = val.slice(0, cursor);
      const lastOpen = before.lastIndexOf(trigger);
      const lastClose = before.lastIndexOf(closeTrigger);

      if (lastOpen >= 0 && lastOpen > lastClose) {
        const partial = before.slice(lastOpen + trigger.length);
        if (/^\w*$/.test(partial)) {
          setTriggerPos(lastOpen);
          setActiveIdx(0);
          setOpen(true);
          updateVirtualPosition(lastOpen);
          return;
        }
      }
      setOpen(false);
      setTriggerPos(-1);
    }

    function insertVar(varKey: string) {
      const cursor = getCursor();
      const prefix = value.slice(0, triggerPos);
      const suffix = value.slice(cursor);
      const insertion = `${trigger}${varKey}${closeTrigger}`;
      const newValue = prefix + insertion + suffix;

      const nativeEvent = new Event("input", { bubbles: true });
      Object.defineProperty(nativeEvent, "target", {
        value: { value: newValue },
      });
      onChange?.(nativeEvent as unknown as ChangeEvent<HTMLInputElement>);

      setOpen(false);
      setTriggerPos(-1);

      const newCursor = prefix.length + insertion.length;
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(newCursor, newCursor);
      });
    }

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
      if (!open || filtered.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertVar(filtered[activeIdx].key);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }

    function handleBlur() {
      setTimeout(() => setOpen(false), 150);
    }

    return (
      <div className="relative w-full">
        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full rounded-md border bg-white px-3 py-1.5 text-sm h-8 font-mono outline-none transition-colors",
            "border-slate-300 dark:border-slate-600 dark:bg-slate-900",
            "focus:border-sky-500 focus:ring-1 focus:ring-sky-500",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        />
        {open && filtered.length > 0 && (
          <FloatingPortal>
            <div
              ref={refs.setFloating}
              style={{
                ...floatingStyles,
                scrollbarWidth: "thin",
                scrollbarColor: "rgb(128 128 128 / 0.35) transparent",
              }}
              className="z-[9999] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1 text-sm max-h-60 overflow-auto"
            >
              <div ref={listRef}>
                {filtered.map((item, idx) => (
                  <div
                    key={item.key}
                    role="option"
                    tabIndex={-1}
                    aria-selected={idx === activeIdx}
                    className={cn(
                      "px-3 py-1.5 cursor-pointer flex items-center gap-3",
                      idx === activeIdx
                        ? "bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
                    )}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertVar(item.key);
                    }}
                  >
                    <code className="text-sky-600 dark:text-sky-400 text-xs">
                      {`${trigger}${item.key}${closeTrigger}`}
                    </code>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FloatingPortal>
        )}
      </div>
    );
  },
);
TemplateInput.displayName = "TemplateInput";
