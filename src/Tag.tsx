import { X } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./utils";

const colorMap: Record<string, string> = {
  default:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  blue: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
  green:
    "bg-green-50 text-green-600 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
  red: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  orange:
    "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800",
  gold: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
  yellow:
    "bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800",
  cyan: "bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-800",
  purple:
    "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800",
  magenta:
    "bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-950 dark:text-pink-400 dark:border-pink-800",
  volcano:
    "bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800",
  lime: "bg-lime-50 text-lime-600 border-lime-200 dark:bg-lime-950 dark:text-lime-400 dark:border-lime-800",
  geekblue:
    "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-800",
  success:
    "bg-green-50 text-green-600 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
  processing:
    "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
  error:
    "bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  warning:
    "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800",
};

const borderlessColorMap: Record<string, string> = {
  default: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  orange:
    "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  gold: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  success: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  processing: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  error: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  warning:
    "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
};

export interface TagProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "color"> {
  /** Preset color name or CSS color string */
  color?: string;
  /** Closable tag */
  closable?: boolean;
  /** Close callback */
  onClose?: (e: React.MouseEvent) => void;
  /** Show border */
  bordered?: boolean;
  /** Icon before text */
  icon?: ReactNode;
}

export function Tag({
  color = "default",
  closable = false,
  onClose,
  bordered = true,
  icon,
  className,
  children,
  ...rest
}: TagProps) {
  const isPreset = color in colorMap;
  const preset = bordered
    ? (colorMap[color] ?? colorMap.default)
    : (borderlessColorMap[color] ?? borderlessColorMap.default);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        isPreset ? preset : undefined,
        bordered && isPreset ? "border" : undefined,
        className,
      )}
      style={
        !isPreset
          ? { backgroundColor: `${color}15`, color, borderColor: color }
          : undefined
      }
      {...rest}
    >
      {icon ? (
        <span className="inline-flex items-center shrink-0">{icon}</span>
      ) : null}
      {children}
      {closable ? (
        <button
          type="button"
          className="inline-flex items-center hover:opacity-70 ml-0.5 -mr-0.5"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.(e);
          }}
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </span>
  );
}
