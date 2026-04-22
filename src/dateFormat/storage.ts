import type { DateFormatConfig, DateFormatStorage } from "./types";

const DEFAULT_KEYS = {
  long: "longDateFormat",
  date: "dateFormat",
  time: "timeFormat",
} as const;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const target = `${name}=`;
  for (const part of document.cookie.split("; ")) {
    if (part.startsWith(target)) {
      try {
        return decodeURIComponent(part.slice(target.length));
      } catch {
        return part.slice(target.length);
      }
    }
  }
  return null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  // biome-ignore lint/suspicious/noDocumentCookie: we are the storage adapter.
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

export function cookieStorage(
  keys?: DateFormatConfig["storageKeys"],
): DateFormatStorage {
  const long = keys?.long ?? DEFAULT_KEYS.long;
  const date = keys?.date ?? DEFAULT_KEYS.date;
  const time = keys?.time ?? DEFAULT_KEYS.time;
  return {
    loadLong: () => readCookie(long),
    saveLong: (v) => writeCookie(long, v),
    loadDate: () => readCookie(date),
    saveDate: (v) => writeCookie(date, v),
    loadTime: () => readCookie(time),
    saveTime: (v) => writeCookie(time, v),
  };
}

export function localStorageStorage(
  keys?: DateFormatConfig["storageKeys"],
): DateFormatStorage {
  const long = keys?.long ?? DEFAULT_KEYS.long;
  const date = keys?.date ?? DEFAULT_KEYS.date;
  const time = keys?.time ?? DEFAULT_KEYS.time;
  const safeGet = (k: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(k);
    } catch {
      return null;
    }
  };
  const safeSet = (k: string, v: string) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(k, v);
    } catch {
      /* swallow quota / privacy errors */
    }
  };
  return {
    loadLong: () => safeGet(long),
    saveLong: (v) => safeSet(long, v),
    loadDate: () => safeGet(date),
    saveDate: (v) => safeSet(date, v),
    loadTime: () => safeGet(time),
    saveTime: (v) => safeSet(time, v),
  };
}

export const noopStorage: DateFormatStorage = {
  loadLong: () => null,
  saveLong: () => {},
  loadDate: () => null,
  saveDate: () => {},
  loadTime: () => null,
  saveTime: () => {},
};
