import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { cookieStorage, localStorageStorage, noopStorage } from "./storage";
import type {
  DateFormatConfig,
  DateFormatContextValue,
  DateFormatStorage,
} from "./types";

const DateFormatCtx = createContext<DateFormatContextValue | null>(null);

const FALLBACK_LONG = "YYYY-MM-DD HH:mm:ss";
const FALLBACK_DATE = "YYYY-MM-DD";
const FALLBACK_TIME = "HH:mm:ss";

function resolveStorage(
  s: DateFormatConfig["storage"],
  keys: DateFormatConfig["storageKeys"],
): DateFormatStorage {
  if (!s || s === "none") return noopStorage;
  if (s === "cookie") return cookieStorage(keys);
  if (s === "localStorage") return localStorageStorage(keys);
  return s;
}

export interface DateFormatProviderProps extends DateFormatConfig {
  children?: ReactNode;
}

export function DateFormatProvider({
  defaultLong = FALLBACK_LONG,
  defaultDate = FALLBACK_DATE,
  defaultTime = FALLBACK_TIME,
  storage,
  storageKeys,
  onChange,
  children,
}: DateFormatProviderProps) {
  const storageRef = useRef<DateFormatStorage>(
    resolveStorage(storage, storageKeys),
  );

  const [longFormat, setLongFormatState] = useState<string>(
    () => storageRef.current.loadLong() ?? defaultLong,
  );
  const [dateFormat, setDateFormatState] = useState<string>(
    () => storageRef.current.loadDate() ?? defaultDate,
  );
  const [timeFormat, setTimeFormatState] = useState<string>(
    () => storageRef.current.loadTime() ?? defaultTime,
  );

  const setLongFormat = useCallback(
    (fmt: string) => {
      setLongFormatState(fmt);
      storageRef.current.saveLong(fmt);
      onChange?.({ longFormat: fmt, dateFormat, timeFormat });
    },
    [dateFormat, timeFormat, onChange],
  );

  const setDateFormat = useCallback(
    (fmt: string) => {
      setDateFormatState(fmt);
      storageRef.current.saveDate(fmt);
      onChange?.({ longFormat, dateFormat: fmt, timeFormat });
    },
    [longFormat, timeFormat, onChange],
  );

  const setTimeFormat = useCallback(
    (fmt: string) => {
      setTimeFormatState(fmt);
      storageRef.current.saveTime(fmt);
      onChange?.({ longFormat, dateFormat, timeFormat: fmt });
    },
    [longFormat, dateFormat, onChange],
  );

  const value = useMemo<DateFormatContextValue>(
    () => ({
      longFormat,
      dateFormat,
      timeFormat,
      setLongFormat,
      setDateFormat,
      setTimeFormat,
    }),
    [
      longFormat,
      dateFormat,
      timeFormat,
      setLongFormat,
      setDateFormat,
      setTimeFormat,
    ],
  );

  return createElement(DateFormatCtx.Provider, { value }, children);
}

/** Read the current date-format state. Throws when used outside provider. */
export function useDateFormat(): DateFormatContextValue {
  const ctx = useContext(DateFormatCtx);
  if (!ctx) {
    throw new Error(
      "useDateFormat must be used within a <ConfigProvider dateFormat={...}> or <DateFormatProvider>",
    );
  }
  return ctx;
}

/** Optional variant — returns `null` when no provider is mounted. */
export function useDateFormatOrNull(): DateFormatContextValue | null {
  return useContext(DateFormatCtx);
}

export { cookieStorage, localStorageStorage, noopStorage } from "./storage";
export type {
  DateFormatConfig,
  DateFormatContextValue,
  DateFormatStorage,
} from "./types";
