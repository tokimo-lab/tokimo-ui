import { cn } from "./utils";

export interface MiniAreaChartProps {
  /** Data points to plot (at least 2 required) */
  data: number[];
  /** Line and fill color — any CSS color string */
  color?: string;
  /**
   * Y axis minimum.
   * Defaults to `Math.min(...data)` — normalises to data range (stock-style).
   * Pass `0` for percentage / resource-usage style charts.
   */
  min?: number;
  /**
   * Y axis maximum.
   * Defaults to `Math.max(...data)` — normalises to data range.
   */
  max?: number;
  /** Opacity of the area fill under the line (default 0.18) */
  fillOpacity?: number;
  /** Stroke width in SVG user units (default 1.5) */
  strokeWidth?: number;
  className?: string;
}

/**
 * Minimal area + line chart rendered as a pure SVG.
 *
 * Fills its container via `block h-full w-full` so just control size
 * through the parent element.  Compatible with both stock widgets
 * (normalise to data range) and resource monitors (pass `min=0 max=100`).
 */
export function MiniAreaChart({
  data,
  color = "#3b82f6",
  min,
  max,
  fillOpacity = 0.18,
  strokeWidth = 1.5,
  className,
}: MiniAreaChartProps) {
  if (data.length < 2) return null;

  const n = data.length;
  const dataMin = min ?? Math.min(...data);
  const dataMax = max ?? Math.max(...data);
  const range = dataMax - dataMin || 1;

  // viewBox 0 0 100 100 with 10% vertical padding so line never clips edges
  const toX = (i: number) => ((i / (n - 1)) * 100).toFixed(2);
  const toY = (v: number) => (10 + (1 - (v - dataMin) / range) * 80).toFixed(2);

  const pts = data.map((v, i) => `${toX(i)},${toY(v)}`);
  const lineD = `M${pts.join("L")}`;
  const fillD = `${lineD}L100,100L0,100Z`;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn("block h-full w-full", className)}
    >
      <path d={fillD} fill={color} fillOpacity={fillOpacity} stroke="none" />
      <path
        d={lineD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
