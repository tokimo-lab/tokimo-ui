import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import {
  autoUpdate,
  FloatingPortal,
  flip,
  offset,
  type Placement,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import { Smile } from "lucide-react";
import { type MouseEvent, useState } from "react";
import { cn } from "./utils";

export interface EmojiPickerProps {
  /** Currently selected emoji character */
  value?: string | null;
  /** Called when user selects an emoji */
  onChange?: (emoji: string) => void;
  /** If provided, a "clear" button is rendered next to the trigger when a value is set */
  onClear?: () => void;
  /** Disables interaction */
  disabled?: boolean;
  /** Additional className for the trigger button */
  className?: string;
  /** Floating panel placement */
  placement?: Placement;
  /** Emoji picker theme */
  theme?: "light" | "dark" | "auto";
  /** Emoji picker locale */
  locale?: string;
  /** Native title attribute on trigger button */
  title?: string;
  /** Stop click event propagation on the trigger (e.g. inside a menu item) */
  stopPropagation?: boolean;
  /** Clear button label */
  clearLabel?: string;
  /**
   * "default" — full box with border, for use in forms.
   * "icon" — bare icon only, no border/bg, for use inside menu icon slots.
   */
  variant?: "default" | "icon";
}

export function EmojiPicker({
  value,
  onChange,
  onClear,
  disabled,
  className,
  placement = "bottom-start",
  theme = "auto",
  locale = "zh",
  title = "点击选择图标",
  stopPropagation = false,
  clearLabel = "清除",
  variant = "default",
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    middleware: [offset(6), flip(), shift({ padding: 5 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context, { enabled: !disabled });
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);

  const referenceProps = getReferenceProps();

  const handleTriggerClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) e.stopPropagation();
    if (typeof referenceProps.onClick === "function") {
      referenceProps.onClick(e);
    }
  };

  if (variant === "icon") {
    return (
      <>
        <button
          type="button"
          ref={refs.setReference}
          title={title}
          disabled={disabled}
          className={cn(
            "inline-flex items-center justify-center appearance-none bg-transparent border-0 p-1 aspect-square rounded cursor-pointer transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
            disabled && "cursor-not-allowed opacity-50",
            className,
          )}
          {...referenceProps}
          onClick={handleTriggerClick}
        >
          {value ? (
            <span className="text-[1em] leading-none">{value}</span>
          ) : (
            <Smile className="w-[1em] h-[1em] text-[var(--text-muted)]" />
          )}
        </button>
        {open && (
          <FloatingPortal>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className="z-[9999]"
              {...getFloatingProps()}
            >
              <Picker
                data={data}
                locale={locale}
                theme={theme}
                previewPosition="none"
                skinTonePosition="none"
                onEmojiSelect={(emoji: { native: string }) => {
                  onChange?.(emoji.native);
                  setOpen(false);
                }}
              />
            </div>
          </FloatingPortal>
        )}
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        ref={refs.setReference}
        title={title}
        disabled={disabled}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border text-xl transition-colors",
          open
            ? "border-[var(--accent)] bg-[var(--accent)]/10"
            : "border-[var(--glass-border)] bg-white hover:border-[var(--glass-border)] dark:bg-gray-900",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        {...referenceProps}
        onClick={handleTriggerClick}
      >
        {value ? (
          <span className="text-base leading-none">{value}</span>
        ) : (
          <Smile className="h-4 w-4 text-[var(--text-muted)]" />
        )}
      </button>
      {onClear && value && (
        <button
          type="button"
          onClick={() => onClear()}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {clearLabel}
        </button>
      )}
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-[9999]"
            {...getFloatingProps()}
          >
            <Picker
              data={data}
              locale={locale}
              theme={theme}
              previewPosition="none"
              skinTonePosition="none"
              onEmojiSelect={(emoji: { native: string }) => {
                onChange?.(emoji.native);
                setOpen(false);
              }}
            />
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
