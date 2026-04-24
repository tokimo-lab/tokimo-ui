import type { ReactNode } from "react";
import { Button } from "./Button";
import { cn } from "./utils";

/**
 * StickySaveBar — bottom-pinned save/discard bar for multi-field settings pages.
 *
 * Use on pages where multiple fields are edited together and saving should be
 * an explicit action (e.g. external DB credentials, AI provider config). For
 * single-switch or single-select changes prefer onChange-based immediate save
 * instead of this bar.
 *
 * The bar is absolutely pinned to the bottom of its nearest `relative` parent.
 * Pages typically wrap content in a `relative` flex column; the bar sits on
 * top of the scroll content so the user always sees it while editing.
 *
 * The `dirty` prop hides the bar entirely when there are no unsaved changes,
 * avoiding layout churn for pure read-only views.
 */
export interface StickySaveBarProps {
  /** Whether the form has unsaved changes. Bar is hidden when false. */
  dirty: boolean;
  /** Whether the save action is in-flight. Disables buttons and shows loading. */
  loading?: boolean;
  /** Save handler. Required. */
  onSave: () => void | Promise<void>;
  /** Discard / reset handler. Required. */
  onReset: () => void;
  /** Optional left-side message (e.g. "You have unsaved changes"). */
  message?: ReactNode;
  /** Override the save button label. */
  saveLabel?: ReactNode;
  /** Override the reset button label. */
  resetLabel?: ReactNode;
  className?: string;
}

export function StickySaveBar({
  dirty,
  loading = false,
  onSave,
  onReset,
  message,
  saveLabel = "Save",
  resetLabel = "Discard",
  className,
}: StickySaveBarProps) {
  if (!dirty) return null;
  return (
    <div
      className={cn(
        "sticky bottom-0 left-0 right-0 z-10",
        "flex items-center justify-between gap-3",
        "px-4 py-3",
        "bg-white/80 dark:bg-black/60 backdrop-blur-md",
        "border-t border-black/[0.06] dark:border-white/[0.08]",
        className,
      )}
    >
      <div className="text-xs text-fg-muted truncate">{message}</div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button variant="default" onClick={onReset} disabled={loading}>
          {resetLabel}
        </Button>
        <Button
          variant="primary"
          onClick={() => void onSave()}
          loading={loading}
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
