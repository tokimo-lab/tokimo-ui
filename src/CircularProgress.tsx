import type { ReactNode } from "react";

interface CircularProgressProps {
  /** Progress value 0–100 */
  value: number;
  /** Diameter in pixels (default 24) */
  size?: number;
  /** Stroke width in pixels (default 2.5) */
  strokeWidth?: number;
  /** Custom color for the progress arc (default: current theme accent) */
  color?: string;
  /** Whether to show the percentage text in the center */
  showText?: boolean;
  /** Custom center content (overrides showText) */
  children?: ReactNode;
  className?: string;
}

/**
 * Tiny circular progress indicator with optional center label.
 *
 * Designed to fit in sidebar `extra` slots (~24×24 px).
 */
export function CircularProgress({
  value,
  size = 24,
  strokeWidth = 2.5,
  color,
  showText = true,
  children,
  className,
}: CircularProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;
  const pct = Math.round(clamped);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ display: "block" }}
    >
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-black/[0.08] dark:text-white/[0.08]"
      />
      {/* Progress arc */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color ?? "var(--accent, #f97316)"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
        className="transition-[stroke-dashoffset] duration-300"
      />
      {/* Center text */}
      {children ??
        (showText && (
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-fg-secondary"
            style={{
              fontSize: size * 0.34,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {pct}
          </text>
        ))}
    </svg>
  );
}
