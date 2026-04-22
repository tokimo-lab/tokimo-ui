/** Resolved theme — what's actually applied to the DOM. */
export type Theme = "light" | "dark";

/** User-facing theme preference. `auto` follows `prefers-color-scheme`. */
export type ThemeMode = "auto" | "light" | "dark";

/**
 * Accent color identifier.
 *
 * - A preset name (any string — meaning is project-defined; the UI lib only
 *   sets it as the `data-accent` attribute on `<html>`)
 * - `custom:#rrggbb` — opt-in custom CSS variable injection (when
 *   `customAccentVars: true` on the provider)
 */
export type AccentColor = string;

/**
 * Storage adapter. Default implementation reads/writes cookies so that an
 * inline pre-React bootstrap script can read the same values to prevent FOUC.
 */
export interface ThemeStorage {
  loadMode(): ThemeMode | null;
  saveMode(mode: ThemeMode): void;
  loadAccent(): AccentColor | null;
  saveAccent(accent: AccentColor): void;
}

export interface ThemeConfig {
  /** Initial mode if storage has no value. Defaults to `"auto"`. */
  defaultMode?: ThemeMode;
  /** Initial accent if storage has no value. Defaults to `undefined` (no `data-accent`). */
  defaultAccent?: AccentColor;
  /**
   * Storage adapter. Pass `"cookie"` (default with keys `themeMode` / `accentColor`),
   * `"localStorage"`, `"none"`, or a custom adapter.
   */
  storage?: "cookie" | "localStorage" | "none" | ThemeStorage;
  /** Override storage keys (only used when `storage` is `"cookie"` or `"localStorage"`). */
  storageKeys?: { mode?: string; accent?: string };
  /**
   * If `true`, accent values matching `custom:#rrggbb` will set
   * `--custom-accent`, `--custom-accent-hover`, `--custom-accent-subtle`,
   * `--custom-accent-subtle-hover`, `--custom-accent-muted`,
   * `--custom-accent-text`, `--custom-accent-secondary`,
   * `--custom-accent-secondary-text`, `--custom-aurora-1/2/3`,
   * `--custom-gradient-from/to` on `<html>`.
   *
   * Defaults to `true`.
   */
  customAccentVars?: boolean;
  /**
   * Optional change callbacks (e.g. to sync a server-side preference).
   * The UI lib already persists to storage; these fire in addition.
   */
  onModeChange?: (mode: ThemeMode) => void;
  onAccentChange?: (accent: AccentColor) => void;
}

export interface ThemeContextValue {
  /** Resolved theme (`"light"` | `"dark"`). */
  theme: Theme;
  /** User preference. */
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
}
