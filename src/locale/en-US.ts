import type { Locale } from "./types";

export const enUS: Locale = {
  Modal: {
    okText: "OK",
    cancelText: "Cancel",
  },
  Popconfirm: {
    okText: "OK",
    cancelText: "Cancel",
  },
  Select: {
    placeholder: "Please select",
    searchPlaceholder: "Search...",
    notFoundContent: "No matching options",
  },
  List: {
    emptyText: "No data",
  },
  Empty: {
    description: "No data",
  },
  Upload: {
    uploadText: "Upload",
    uploadFile: "Upload file",
    uploading: "Uploading…",
    dragHint: "Click or drag files here to upload",
  },
  EmojiPicker: {
    title: "Click to choose icon",
    clearLabel: "Clear",
  },
  Pagination: {
    pageSizeSuffix: "/ page",
  },
  Form: {
    required: (name) => `${name} is required`,
    invalidUrl: "Please enter a valid URL",
    invalidEmail: "Please enter a valid email",
    minLength: (n) => `At least ${n} characters`,
    maxLength: (n) => `At most ${n} characters`,
    patternMismatch: "Invalid format",
    validationFailed: "Validation failed",
  },
  DatePicker: {
    datePlaceholder: "Select date",
    timePlaceholder: "Select time",
    dateTimePlaceholder: "Select date and time",
    now: "Now",
    ok: "OK",
    today: "Today",
    formatYear: (year) => String(year),
    formatMonth: (m) =>
      [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ][m - 1] ?? String(m),
    weekDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    monthNamesShort: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
  },
};
