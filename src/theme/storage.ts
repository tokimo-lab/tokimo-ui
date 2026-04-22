import type { AccentColor, ThemeMode, ThemeStorage } from "./types";

const DEFAULT_MODE_KEY = "themeMode";
const DEFAULT_ACCENT_KEY = "accentColor";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function setCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  // biome-ignore lint/suspicious/noDocumentCookie: cookie is required for FOUC-free pre-React bootstrap
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

function isThemeMode(v: unknown): v is ThemeMode {
  return v === "auto" || v === "light" || v === "dark";
}

export function cookieStorage(keys?: {
  mode?: string;
  accent?: string;
}): ThemeStorage {
  const modeKey = keys?.mode ?? DEFAULT_MODE_KEY;
  const accentKey = keys?.accent ?? DEFAULT_ACCENT_KEY;
  return {
    loadMode: () => {
      const v = getCookie(modeKey);
      return isThemeMode(v) ? v : null;
    },
    saveMode: (mode) => setCookie(modeKey, mode),
    loadAccent: () => getCookie(accentKey),
    saveAccent: (accent) => setCookie(accentKey, accent),
  };
}

export function localStorageStorage(keys?: {
  mode?: string;
  accent?: string;
}): ThemeStorage {
  const modeKey = keys?.mode ?? DEFAULT_MODE_KEY;
  const accentKey = keys?.accent ?? DEFAULT_ACCENT_KEY;
  const safeGet = (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const safeSet = (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore quota / privacy mode errors
    }
  };
  return {
    loadMode: () => {
      const v = safeGet(modeKey);
      return isThemeMode(v) ? v : null;
    },
    saveMode: (mode) => safeSet(modeKey, mode),
    loadAccent: () => safeGet(accentKey),
    saveAccent: (accent: AccentColor) => safeSet(accentKey, accent),
  };
}

export const noopStorage: ThemeStorage = {
  loadMode: () => null,
  saveMode: () => {},
  loadAccent: () => null,
  saveAccent: () => {},
};
