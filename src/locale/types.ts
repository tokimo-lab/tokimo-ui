/**
 * Locale interface for @tokiomo/components.
 *
 * Components read defaults from this object via `useLocale()`. Per-call
 * overrides via component props always take precedence.
 *
 * To add a new language, implement this interface (see `en-US.ts`/`zh-CN.ts`)
 * and pass it via `<ConfigProvider locale={yourLocale}>`.
 */
export interface Locale {
  Modal: {
    okText: string;
    cancelText: string;
  };
  Popconfirm: {
    okText: string;
    cancelText: string;
  };
  Select: {
    placeholder: string;
    searchPlaceholder: string;
    notFoundContent: string;
  };
  List: {
    emptyText: string;
  };
  Empty: {
    description: string;
  };
  Upload: {
    uploadText: string;
    uploadFile: string;
    uploading: string;
    dragHint: string;
  };
  EmojiPicker: {
    title: string;
    clearLabel: string;
  };
  Pagination: {
    /** Suffix appended to page size option, e.g. "/ page" or "/ 页". */
    pageSizeSuffix: string;
  };
  Form: {
    required: (name: string) => string;
    invalidUrl: string;
    invalidEmail: string;
    minLength: (n: number) => string;
    maxLength: (n: number) => string;
    patternMismatch: string;
    validationFailed: string;
  };
  DatePicker: {
    datePlaceholder: string;
    timePlaceholder: string;
    dateTimePlaceholder: string;
    now: string;
    ok: string;
    today: string;
    /** Year header — given a year number, returns the display string (e.g. "2026" / "2026年"). */
    formatYear: (year: number) => string;
    /** Month header — given a 1-indexed month, returns the display string (e.g. "Apr" / "4月"). */
    formatMonth: (month1: number) => string;
    /** Short weekday labels starting from Sunday, length must be 7. */
    weekDays: readonly [string, string, string, string, string, string, string];
    /** Short month labels January..December, length must be 12. */
    monthNamesShort: readonly [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
    ];
  };
}
