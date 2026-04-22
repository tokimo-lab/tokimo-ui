/**
 * User-configurable date / time format templates (dayjs tokens — the full
 * set: `YYYY MMM DD dddd HH mm ss A` etc).
 *
 * The UI lib bundles dayjs (matching antd's approach) so `useDateFormat()`
 * exposes ready-to-use `formatLong / formatDate / formatTime` helpers and
 * `DatePicker / TimePicker / DateTimePicker` parse + render with full token
 * support out of the box. Consumers don't need their own date library.
 */
export type DateInput = Date | string | number | null | undefined;

export interface DateFormatStorage {
  loadLong(): string | null;
  saveLong(value: string): void;
  loadDate(): string | null;
  saveDate(value: string): void;
  loadTime(): string | null;
  saveTime(value: string): void;
}

export interface DateFormatConfig {
  /** Default long template if storage has no value. Defaults to `"YYYY-MM-DD HH:mm:ss"`. */
  defaultLong?: string;
  /** Default date template if storage has no value. Defaults to `"YYYY-MM-DD"`. */
  defaultDate?: string;
  /** Default time template if storage has no value. Defaults to `"HH:mm:ss"`. */
  defaultTime?: string;
  /**
   * Storage adapter. Pass `"none"` (default — DB-only, hydrate via setter),
   * `"cookie"`, `"localStorage"`, or a custom adapter.
   */
  storage?: "cookie" | "localStorage" | "none" | DateFormatStorage;
  /** Override storage keys (only used when `storage` is `"cookie"` or `"localStorage"`). */
  storageKeys?: { long?: string; date?: string; time?: string };
  /** Optional change callback (e.g. to sync a server-side preference). */
  onChange?: (next: {
    longFormat: string;
    dateFormat: string;
    timeFormat: string;
  }) => void;
}

export interface DateFormatContextValue {
  longFormat: string;
  dateFormat: string;
  timeFormat: string;
  setLongFormat: (fmt: string) => void;
  setDateFormat: (fmt: string) => void;
  setTimeFormat: (fmt: string) => void;
  /** Format a value with the current `longFormat`. Empty string for invalid / nullish input. */
  formatLong: (value: DateInput) => string;
  /** Format a value with the current `dateFormat`. */
  formatDate: (value: DateInput) => string;
  /** Format a value with the current `timeFormat`. */
  formatTime: (value: DateInput) => string;
}
