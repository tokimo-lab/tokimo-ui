import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./utils";

export type AppAccentColor =
  | "purple"
  | "rose"
  | "violet"
  | "amber"
  | "blue"
  | "green"
  | "cyan"
  | "pink"
  | "orange"
  | "teal"
  | "indigo";

const ICON_BG: Record<AppAccentColor, string> = {
  purple:
    "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
  violet:
    "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
  green: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400",
  cyan: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400",
  pink: "bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400",
  orange:
    "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",
  teal: "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400",
  indigo:
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
};

const BTN_BG: Record<AppAccentColor, string> = {
  purple: "bg-purple-600 hover:bg-purple-700",
  rose: "bg-rose-600 hover:bg-rose-700",
  violet: "bg-violet-600 hover:bg-violet-700",
  amber: "bg-amber-600 hover:bg-amber-700",
  blue: "bg-blue-600 hover:bg-blue-700",
  green: "bg-green-600 hover:bg-green-700",
  cyan: "bg-cyan-600 hover:bg-cyan-700",
  pink: "bg-pink-600 hover:bg-pink-700",
  orange: "bg-orange-600 hover:bg-orange-700",
  teal: "bg-teal-600 hover:bg-teal-700",
  indigo: "bg-indigo-600 hover:bg-indigo-700",
};

export interface SetupGuideFeature {
  icon: LucideIcon;
  label: string;
}

export interface AppSetupGuideProps {
  /** Path to the app's own icon image (e.g. "/page-icons/video.png"). */
  imageSrc: string;
  accentColor: AppAccentColor;
  title: string;
  description: string;
  features: SetupGuideFeature[];
  actionLabel: string;
  actionIcon?: LucideIcon;
  onAction: () => void;
  /** Override button className entirely (e.g. for CSS-variable-based colors). */
  buttonClassName?: string;
  /** Extra content rendered below the action button. */
  children?: ReactNode;
  className?: string;
}

export function AppSetupGuide({
  imageSrc,
  accentColor,
  title,
  description,
  features,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  buttonClassName,
  children,
  className,
}: AppSetupGuideProps) {
  return (
    <div
      className={cn("flex h-full items-center justify-center px-6", className)}
    >
      <div className="flex flex-col items-center gap-6 py-8 max-w-sm w-full">
        {/* App icon */}
        <div className="relative">
          <img
            src={imageSrc}
            alt=""
            className="h-20 w-20 rounded-[22px] object-cover shadow-sm"
          />
        </div>

        {/* Title + tagline */}
        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-bold text-fg-primary">{title}</h2>
          <p className="text-sm text-fg-muted leading-relaxed">{description}</p>
        </div>

        {/* Feature list */}
        <div className="w-full rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.03] px-5 py-4">
          <div className="space-y-3">
            {features.map((f) => {
              const FeatureIcon = f.icon;
              return (
                <div key={f.label} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                      ICON_BG[accentColor],
                    )}
                  >
                    <FeatureIcon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm text-fg-secondary">{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={onAction}
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]",
            buttonClassName ?? BTN_BG[accentColor],
          )}
        >
          {ActionIcon && <ActionIcon className="h-4 w-4" />}
          {actionLabel}
        </button>

        {children}
      </div>
    </div>
  );
}
