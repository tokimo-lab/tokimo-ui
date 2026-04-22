/**
 * User-configurable date / time format templates (dayjs-style tokens:
 * `YYYY MM DD HH mm ss`).
 *
 * The UI lib only stores the strings and exposes setters; actual formatting
 * is delegated to the consumer (e.g. dayjs in the host app) so we don't pull
 * a date library into the bundle. `DatePicker` / `TimePicker` /
 * `DateTimePicker` consume `dateFormat` / `timeFormat` automatically when no
 * `format` prop is passed.
 */
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
}
