import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useEffect,
} from "react";
import { ThemeProvider } from "../theme";
import type { ThemeConfig } from "../theme/types";
import { enUS } from "./en-US";
import type { Locale } from "./types";

export { enUS } from "./en-US";
export { jaJP } from "./ja-JP";
export type { Locale } from "./types";
export { zhCN } from "./zh-CN";

const LocaleContext = createContext<Locale>(enUS);

/**
 * Module-level "current" locale. Tracks the most recently-mounted
 * `ConfigProvider`'s locale so imperative APIs (e.g. `Modal.confirm`,
 * `notification.open`) that mount into a fresh React root can still read it.
 *
 * In-tree components should keep using `useLocale()` so that nested
 * `ConfigProvider`s work correctly.
 */
let currentLocale: Locale = enUS;

export function getGlobalLocale(): Locale {
  return currentLocale;
}

export interface ConfigProviderProps {
  /** Locale for built-in UI strings. Defaults to `enUS`. */
  locale?: Locale;
  /**
   * Theme configuration. When provided, mounts a `<ThemeProvider>` that
   * manages dark mode + accent color and exposes `useTheme()`.
   */
  theme?: ThemeConfig;
  children: ReactNode;
}

/**
 * Inject locale and (optionally) theme to all `@tokimo/ui` descendants.
 *
 * Per-component prop overrides always win over the locale default.
 */
export function ConfigProvider({
  locale = enUS,
  theme,
  children,
}: ConfigProviderProps) {
  useEffect(() => {
    currentLocale = locale;
  }, [locale]);

  const localeNode = createElement(
    LocaleContext.Provider,
    { value: locale },
    children,
  );

  if (!theme) return localeNode;
  return createElement(ThemeProvider, { ...theme }, localeNode);
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}
