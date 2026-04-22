import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  applyAccentAttribute,
  applyThemeClass,
  detectSystemTheme,
} from "./dom";
import { cookieStorage, localStorageStorage, noopStorage } from "./storage";
import type {
  AccentColor,
  Theme,
  ThemeConfig,
  ThemeContextValue,
  ThemeMode,
  ThemeStorage,
} from "./types";

const ThemeCtx = createContext<ThemeContextValue | null>(null);

function resolveStorage(
  s: ThemeConfig["storage"],
  keys: ThemeConfig["storageKeys"],
): ThemeStorage {
  if (!s || s === "cookie") return cookieStorage(keys);
  if (s === "localStorage") return localStorageStorage(keys);
  if (s === "none") return noopStorage;
  return s;
}

export interface ThemeProviderProps extends ThemeConfig {
  children?: ReactNode;
}

export function ThemeProvider({
  defaultMode = "auto",
  defaultAccent,
  storage,
  storageKeys,
  customAccentVars = true,
  onModeChange,
  onAccentChange,
  children,
}: ThemeProviderProps) {
  const storageRef = useRef<ThemeStorage>(resolveStorage(storage, storageKeys));

  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    () => storageRef.current.loadMode() ?? defaultMode,
  );
  const [accent, setAccentState] = useState<AccentColor>(
    () => storageRef.current.loadAccent() ?? defaultAccent ?? "",
  );
  const [theme, setTheme] = useState<Theme>(() =>
    themeMode === "auto" ? detectSystemTheme() : themeMode,
  );

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      setThemeModeState(mode);
      storageRef.current.saveMode(mode);
      onModeChange?.(mode);
    },
    [onModeChange],
  );

  const setAccent = useCallback(
    (next: AccentColor) => {
      setAccentState(next);
      storageRef.current.saveAccent(next);
      onAccentChange?.(next);
    },
    [onAccentChange],
  );

  // Apply theme mode → resolved theme + DOM class
  useEffect(() => {
    const resolved =
      themeMode === "auto" ? detectSystemTheme() : (themeMode as Theme);
    setTheme(resolved);
    applyThemeClass(resolved);
  }, [themeMode]);

  // Listen to system color scheme changes when in auto mode
  useEffect(() => {
    if (typeof window === "undefined" || themeMode !== "auto") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const next: Theme = media.matches ? "dark" : "light";
      setTheme(next);
      applyThemeClass(next);
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [themeMode]);

  // Apply accent → data-attribute (+ custom vars when applicable)
  useEffect(() => {
    if (!accent) return;
    applyAccentAttribute(accent, {
      customAccentVars,
      isDark: theme === "dark",
    });
  }, [accent, theme, customAccentVars]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, themeMode, setThemeMode, accent, setAccent }),
    [theme, themeMode, setThemeMode, accent, setAccent],
  );

  return createElement(ThemeCtx.Provider, { value }, children);
}

/** Read the current theme state. Throws when used outside `<ConfigProvider theme={...}>` / `<ThemeProvider>`. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeCtx);
  if (!ctx) {
    throw new Error(
      "useTheme must be used within a <ConfigProvider theme={...}> or <ThemeProvider>",
    );
  }
  return ctx;
}

/** Optional variant — returns `null` when no provider is mounted. */
export function useThemeOrNull(): ThemeContextValue | null {
  return useContext(ThemeCtx);
}

export {
  applyAccentAttribute,
  applyCustomAccentVars,
  applyThemeClass,
  detectSystemTheme,
  getCustomHex,
  isCustomAccent,
} from "./dom";
export { cookieStorage, localStorageStorage, noopStorage } from "./storage";
export type {
  AccentColor,
  Theme,
  ThemeConfig,
  ThemeContextValue,
  ThemeMode,
  ThemeStorage,
} from "./types";
