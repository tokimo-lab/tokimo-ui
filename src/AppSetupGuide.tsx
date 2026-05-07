import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
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

export interface SetupGuideFeature {
  icon: LucideIcon;
  label: string;
}

export interface AppSetupGuideProps {
  /** Path to the app's own icon image (e.g. "/page-icons/video.png"). */
  imageSrc?: string;
  /** Lucide icon component. Used when `imageSrc` is not provided. */
  icon?: LucideIcon;
  /** Tailwind gradient classes for the icon background. */
  gradientClassName?: string;
  /** Show sparkle decoration on the icon (defaults to `true` in icon mode). */
  showSparkle?: boolean;
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
  icon: Icon,
  gradientClassName = "from-indigo-400 via-purple-500 to-pink-500",
  showSparkle,
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
  const useIcon = !imageSrc && Icon;
  const sparkle = useIcon ? (showSparkle ?? true) : false;

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center overflow-auto bg-[var(--bg-glass)] px-8 py-12 backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-10 text-center">
        {/* App icon */}
        {imageSrc ? (
          <img
            src={imageSrc}
            alt=""
            className="h-24 w-24 rounded-3xl object-cover shadow-[0_20px_60px_-15px_rgba(120,80,255,0.6)]"
          />
        ) : useIcon ? (
          <div
            className={cn(
              "relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br shadow-[0_20px_60px_-15px_rgba(120,80,255,0.6)]",
              gradientClassName,
            )}
          >
            <Icon size={44} className="text-white" strokeWidth={2.2} />
            {sparkle && (
              <Sparkles
                size={18}
                className="absolute -right-1 -top-1 text-amber-300"
              />
            )}
          </div>
        ) : null}

        {/* Title + tagline */}
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {title}
          </h2>
          <p className="max-w-xs text-base leading-relaxed text-[var(--text-secondary)]">
            {description}
          </p>
        </div>

        {/* Feature list */}
        <div className="flex w-full flex-col gap-3">
          {features.map((f) => {
            const FeatureIcon = f.icon;
            return (
              <div
                key={f.label}
                className="flex items-center gap-3 rounded-2xl bg-[var(--fill-tertiary)] px-4 py-3 text-left"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 flex-none items-center justify-center rounded-xl",
                    ICON_BG[accentColor],
                  )}
                >
                  <FeatureIcon className="h-5 w-5" />
                </div>
                <span className="text-sm leading-snug text-[var(--text-primary)]">
                  {f.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={onAction}
          className={cn(
            "mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white py-4 text-base font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]",
            buttonClassName,
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
