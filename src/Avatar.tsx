import { type ReactNode, useEffect, useState } from "react";
import { cn } from "./utils";

// ── Avatar color / initial helpers ───────────────────────────────────────

const AVATAR_COLORS = [
  "#60a5fa",
  "#34d399",
  "#f97316",
  "#a78bfa",
  "#f43f5e",
  "#14b8a6",
  "#eab308",
  "#38bdf8",
  "#8b5cf6",
  "#f59e0b",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarColor(value?: string | null): string {
  if (!value) return AVATAR_COLORS[0];
  return AVATAR_COLORS[hashString(value) % AVATAR_COLORS.length];
}

export function getAvatarInitial(
  name?: string | null,
  email?: string | null,
): string {
  const base = (name || email || "").trim();
  if (!base) return "?";
  return base[0].toUpperCase();
}

// ── Avatar URL resolver (app injects at startup) ─────────────────────────

type AvatarUser = {
  id?: string | null;
  avatarKey?: string | null;
  name?: string | null;
  email?: string | null;
};

let urlResolver: ((user: AvatarUser) => string | undefined) | undefined;

/**
 * Register a resolver that converts a user object to an avatar image URL.
 * Call once at app startup (e.g. main.tsx).
 *
 * @example
 * setAvatarUrlResolver((u) => u.avatarKey ? storageUrl(u.avatarKey) : undefined)
 */
export function setAvatarUrlResolver(
  resolver: (user: AvatarUser) => string | undefined,
): void {
  urlResolver = resolver;
}

// ── Avatar component ─────────────────────────────────────────────────────

export interface AvatarProps {
  /** Explicit image url (highest priority). */
  src?: string;
  /** User object — resolves avatar URL + fallback initial internally. */
  user?: AvatarUser | null;
  /** Alt text */
  alt?: string;
  /** Size in pixels */
  size?: number | "small" | "default" | "large";
  /** Shape */
  shape?: "circle" | "square";
  /** Icon placeholder when no image */
  icon?: ReactNode;
  /** Background color */
  style?: React.CSSProperties;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
}

const sizeNum = { small: 24, default: 32, large: 40 };

export function Avatar({
  src,
  user,
  alt,
  size = "default",
  shape = "circle",
  icon,
  style,
  className,
  children,
  onClick,
}: AvatarProps) {
  const px = typeof size === "number" ? size : sizeNum[size];
  const fontSize = Math.max(px * 0.45, 12);

  // Resolve src: explicit prop > user resolver
  const resolvedSrc =
    src ?? (user && urlResolver ? urlResolver(user) : undefined);

  // Derive fallback from user when no children/icon provided
  const fallbackInitial =
    children ?? (user ? getAvatarInitial(user.name, user.email) : undefined);
  const fallbackColor = user
    ? getAvatarColor(user.id ?? user.email)
    : undefined;

  const [failed, setFailed] = useState(false);

  // Reset failure flag when src changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only track resolvedSrc
  useEffect(() => {
    setFailed(false);
  }, [resolvedSrc]);

  const showImage = resolvedSrc && !failed;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: role is conditionally set based on onClick
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden bg-fill-tertiary text-fg-muted shrink-0 select-none",
        shape === "circle" ? "rounded-full" : "rounded",
        onClick && "cursor-pointer",
        className,
      )}
      style={{
        width: px,
        height: px,
        fontSize,
        ...(!showImage && fallbackColor
          ? { backgroundColor: fallbackColor }
          : undefined),
        ...style,
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
    >
      {showImage ? (
        <img
          src={resolvedSrc}
          alt={alt ?? user?.name ?? user?.email ?? ""}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : icon ? (
        icon
      ) : fallbackInitial ? (
        <span className="font-medium leading-none">{fallbackInitial}</span>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-[60%] w-[60%]"
          fill="currentColor"
        >
          <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" />
        </svg>
      )}
    </span>
  );
}
