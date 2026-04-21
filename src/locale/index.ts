import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useEffect,
} from "react";
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
  locale?: Locale;
  children: ReactNode;
}

/**
 * Inject a `Locale` to all `@tokimo/ui` descendants.
 *
 * Defaults to `enUS` when omitted. Per-component prop overrides always win
 * over the locale default.
 */
export function ConfigProvider({
  locale = enUS,
  children,
}: ConfigProviderProps) {
  useEffect(() => {
    currentLocale = locale;
  }, [locale]);
  return createElement(LocaleContext.Provider, { value: locale }, children);
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}
