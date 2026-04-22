import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useEffect,
} from "react";
import { DateFormatProvider } from "../dateFormat";
import type { DateFormatConfig } from "../dateFormat/types";
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
  /**
   * User-configurable date / time format templates. When provided, mounts a
   * `<DateFormatProvider>` and exposes `useDateFormat()`. `DatePicker`,
   * `TimePicker`, and `DateTimePicker` automatically consume these templates
   * when no `format` prop is passed.
   */
  dateFormat?: DateFormatConfig;
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
  dateFormat,
  children,
}: ConfigProviderProps) {
  useEffect(() => {
    currentLocale = locale;
  }, [locale]);

  let node: ReactNode = createElement(
    LocaleContext.Provider,
    { value: locale },
    children,
  );

  if (dateFormat) {
    node = createElement(DateFormatProvider, { ...dateFormat }, node);
  }
  if (theme) {
    node = createElement(ThemeProvider, { ...theme }, node);
  }
  return node;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}
