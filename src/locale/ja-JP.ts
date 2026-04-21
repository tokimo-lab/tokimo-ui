import type { Locale } from "./types";

export const jaJP: Locale = {
  Modal: {
    okText: "OK",
    cancelText: "キャンセル",
  },
  Popconfirm: {
    okText: "OK",
    cancelText: "キャンセル",
  },
  Select: {
    placeholder: "選択してください",
    searchPlaceholder: "検索...",
    notFoundContent: "該当する項目がありません",
  },
  List: {
    emptyText: "データがありません",
  },
  Empty: {
    description: "データがありません",
  },
  Upload: {
    uploadText: "アップロード",
    uploadFile: "ファイルをアップロード",
    uploading: "アップロード中…",
    dragHint: "クリックまたはドラッグしてファイルをアップロード",
  },
  EmojiPicker: {
    title: "アイコンを選択",
    clearLabel: "クリア",
  },
  Pagination: {
    pageSizeSuffix: "/ ページ",
  },
  Form: {
    required: (name) => `${name}は必須項目です`,
    invalidUrl: "有効な URL を入力してください",
    invalidEmail: "有効なメールアドレスを入力してください",
    minLength: (n) => `${n} 文字以上で入力してください`,
    maxLength: (n) => `${n} 文字以内で入力してください`,
    patternMismatch: "形式が正しくありません",
    validationFailed: "検証に失敗しました",
  },
  DatePicker: {
    datePlaceholder: "日付を選択",
    timePlaceholder: "時刻を選択",
    dateTimePlaceholder: "日時を選択",
    now: "現在",
    ok: "OK",
    today: "今日",
    formatYear: (year) => `${year}年`,
    formatMonth: (m) => `${m}月`,
    weekDays: ["日", "月", "火", "水", "木", "金", "土"],
    monthNamesShort: [
      "1月",
      "2月",
      "3月",
      "4月",
      "5月",
      "6月",
      "7月",
      "8月",
      "9月",
      "10月",
      "11月",
      "12月",
    ],
  },
};
