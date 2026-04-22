import type { AccentColor, Theme } from "./types";

const CUSTOM_PREFIX = "custom:";

export function isCustomAccent(accent: AccentColor): boolean {
  return typeof accent === "string" && accent.startsWith(CUSTOM_PREFIX);
}

export function getCustomHex(accent: AccentColor): string {
  return accent.slice(CUSTOM_PREFIX.length);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const bigint = Number.parseInt(h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function darkenHex(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  const d = 1 - factor;
  return `#${[r, g, b]
    .map((c) =>
      Math.round(c * d)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function lightenHex(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `#${[r, g, b]
    .map((c) =>
      Math.round(c + (255 - c) * factor)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/** Detect the system color scheme preference. */
export function detectSystemTheme(): Theme {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

/** Toggle the `dark` class on `<html>`. */
export function applyThemeClass(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Apply CSS custom properties for a `custom:#hex` accent. */
export function applyCustomAccentVars(hex: string, isDark: boolean): void {
  if (typeof document === "undefined") return;
  const { r, g, b } = hexToRgb(hex);
  const el = document.documentElement;
  el.style.setProperty("--custom-accent", hex);
  el.style.setProperty("--custom-accent-hover", darkenHex(hex, 0.15));
  el.style.setProperty(
    "--custom-accent-subtle",
    `rgba(${r}, ${g}, ${b}, ${isDark ? 0.08 : 0.1})`,
  );
  el.style.setProperty(
    "--custom-accent-subtle-hover",
    `rgba(${r}, ${g}, ${b}, ${isDark ? 0.14 : 0.18})`,
  );
  el.style.setProperty("--custom-accent-muted", `rgba(${r}, ${g}, ${b}, 0.5)`);
  el.style.setProperty("--custom-accent-text", lightenHex(hex, 0.3));
  el.style.setProperty("--custom-accent-secondary", darkenHex(hex, 0.2));
  el.style.setProperty("--custom-accent-secondary-text", lightenHex(hex, 0.2));
  el.style.setProperty("--custom-aurora-1", `rgba(${r}, ${g}, ${b}, 0.80)`);
  el.style.setProperty("--custom-aurora-2", `rgba(${r}, ${g}, ${b}, 0.55)`);
  el.style.setProperty("--custom-aurora-3", `rgba(${r}, ${g}, ${b}, 0.40)`);
  el.style.setProperty("--custom-gradient-from", hex);
  el.style.setProperty("--custom-gradient-to", darkenHex(hex, 0.25));
}

/** Apply the `data-accent` attribute on `<html>`. */
export function applyAccentAttribute(
  accent: AccentColor,
  options: { customAccentVars: boolean; isDark: boolean },
): void {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  if (isCustomAccent(accent)) {
    el.setAttribute("data-accent", "custom");
    if (options.customAccentVars) {
      applyCustomAccentVars(getCustomHex(accent), options.isDark);
    }
  } else {
    el.setAttribute("data-accent", accent);
  }
}
