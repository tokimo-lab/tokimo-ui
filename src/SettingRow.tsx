import type { ReactNode } from "react";
import { Slider, type SliderProps } from "./Slider";
import { cn } from "./utils";

/**
 * SettingRow — unified row layout used across settings pages.
 *
 * Layout: label + description on the left, control on the right, with a
 * thin bottom border to separate adjacent rows. Use inside `SettingGroup`
 * (which adds the section title and top border) or directly on its own.
 */
export interface SettingRowProps {
  /** Left-hand label (primary text). */
  label: ReactNode;
  /** Optional description shown below the label. */
  desc?: ReactNode;
  /** Right-hand control (Switch, Select, Slider, etc.). */
  children: ReactNode;
  className?: string;
  /**
   * Layout orientation.
   * - `"horizontal"` (default): label/desc on the left, control on the right.
   *   Use for compact controls (Switch, Select, Slider, small Input).
   * - `"vertical"`: label/desc on top, control fills the full row below.
   *   Use for wide controls (long Input, Textarea, URL lists, code editors)
   *   or when the control wraps embedded `<Form.Item>`-style fields.
   */
  orientation?: "horizontal" | "vertical";
}

export function SettingRow({
  label,
  desc,
  children,
  className,
  orientation = "horizontal",
}: SettingRowProps) {
  if (orientation === "vertical") {
    return (
      <div
        className={cn(
          "py-3 border-b border-black/[0.04] dark:border-white/[0.06] last:border-b-0",
          className,
        )}
      >
        <div className="mb-2 select-none">
          <div className="text-sm font-medium text-fg-primary leading-tight">
            {label}
          </div>
          {desc != null && desc !== "" && (
            <div className="text-xs text-fg-muted mt-1 leading-relaxed">
              {desc}
            </div>
          )}
        </div>
        <div className="w-full">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-6 py-3 border-b border-black/[0.04] dark:border-white/[0.06] last:border-b-0 select-none",
        className,
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-fg-primary leading-tight">
          {label}
        </div>
        {desc != null && desc !== "" && (
          <div className="text-xs text-fg-muted mt-1 leading-relaxed">
            {desc}
          </div>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

/**
 * SettingGroup — an optional section header + a set of rows.
 *
 * Renders an h3 title (when provided) and wraps children in a top-bordered
 * container so the first row's border aligns with the title.
 */
export interface SettingGroupProps {
  /** Optional section title (h3). */
  title?: ReactNode;
  /** Optional description shown below the title. */
  desc?: ReactNode;
  children: ReactNode;
  className?: string;
  /**
   * Visual variant.
   * - `"plain"` (default): no outer container; rows share only a top border.
   *   This is the canonical Windows-11-style "recessive" look used in system
   *   settings. Groups are visually separated via whitespace between groups.
   * - `"card"`: wraps the group in a rounded bordered card with padding.
   *   Use sparingly — only when a group must stand out (e.g. inside a page
   *   that mixes narrative sections with a single emphasised setting block).
   *   Do NOT wrap every group in a card; that re-introduces the old
   *   AntD-card style which this unification is removing.
   */
  variant?: "plain" | "card";
}

export function SettingGroup({
  title,
  desc,
  children,
  className,
  variant = "plain",
}: SettingGroupProps) {
  const header =
    (title != null && title !== "") || (desc != null && desc !== "") ? (
      <div className="mb-2">
        {title != null && title !== "" && (
          <h3 className="text-sm font-semibold text-fg-primary leading-tight">
            {title}
          </h3>
        )}
        {desc != null && desc !== "" && (
          <p className="text-xs text-fg-muted mt-1 leading-relaxed">{desc}</p>
        )}
      </div>
    ) : null;

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.02] p-5",
          className,
        )}
      >
        {header}
        <div className="border-t border-black/[0.04] dark:border-white/[0.06]">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {header}
      <div className="border-t border-black/[0.04] dark:border-white/[0.06]">
        {children}
      </div>
    </div>
  );
}

/**
 * SettingSlider — a slider plus a right-aligned numeric readout, sized to
 * fit the right-hand control slot of a `SettingRow`.
 */
export interface SettingSliderProps extends Omit<SliderProps, "className"> {
  /** Suffix appended to the numeric readout (e.g. "px", "%"). */
  suffix?: string;
  /** Overall wrapper width. Default 200px. */
  width?: number | string;
  /** Width of the value label. Default auto. */
  valueWidth?: number | string;
  /** Custom formatter for the displayed value. */
  format?: (value: number) => string;
}

export function SettingSlider({
  suffix = "",
  width = 200,
  valueWidth,
  value,
  format,
  ...sliderProps
}: SettingSliderProps) {
  const numValue = typeof value === "number" ? value : 0;
  const display = format ? format(numValue) : `${numValue}${suffix}`;
  return (
    <div className="flex items-center gap-3" style={{ width }}>
      <Slider className="flex-1" value={value} {...sliderProps} />
      <span
        className="text-sm tabular-nums text-fg-muted text-right"
        style={{ width: valueWidth ?? (suffix ? 44 : 32) }}
      >
        {display}
      </span>
    </div>
  );
}
