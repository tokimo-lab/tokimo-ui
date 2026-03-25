import { memo, type ReactNode } from "react";
import { cn } from "./utils/cn";

export interface PosterCardProps {
  /** Image source URL (already resolved) */
  src?: string | null;
  /** Alt text for the image */
  alt?: string;
  /** Content shown when `src` is absent */
  fallback?: ReactNode;
  /** Absolutely-positioned overlays rendered inside the poster area */
  badges?: ReactNode;
  /** Title area content below the poster */
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Shared poster card — 2:3 aspect-ratio image + title area.
 *
 * Uses `content-visibility: auto` so the browser skips layout/paint for
 * off-screen cards. `contain-intrinsic-size: auto 350px` gives the browser a
 * height estimate for accurate scrollbars.
 */
export const PosterCard = memo(function PosterCard({
  src,
  alt,
  fallback,
  badges,
  children,
  onClick,
  className,
}: PosterCardProps) {
  return (
    <button
      type="button"
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 350px" }}
      className={cn(
        "group w-full cursor-pointer overflow-hidden rounded-lg border border-[var(--glass-border)] bg-white text-left transition-shadow hover:shadow-md dark:bg-gray-800/50",
        className,
      )}
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-[var(--bg-skeleton)]">
        {src ? (
          <img
            src={src}
            alt={alt}
            decoding="async"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          (fallback ?? (
            <div className="flex h-full items-center justify-center text-zinc-600 dark:text-zinc-400">
              <span className="text-3xl">🎬</span>
            </div>
          ))
        )}
        {badges}
      </div>
      <div className="flex h-[52px] flex-col justify-center p-2">
        {children}
      </div>
    </button>
  );
});
