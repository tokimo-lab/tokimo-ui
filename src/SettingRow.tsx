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
}

export function SettingRow({
  label,
  desc,
  children,
  className,
}: SettingRowProps) {
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
}

export function SettingGroup({
  title,
  desc,
  children,
  className,
}: SettingGroupProps) {
  return (
    <div className={className}>
      {title != null && title !== "" && (
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-fg-primary leading-tight">
            {title}
          </h3>
          {desc != null && desc !== "" && (
            <p className="text-xs text-fg-muted mt-1 leading-relaxed">{desc}</p>
          )}
        </div>
      )}
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
