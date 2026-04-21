import type { Locale } from "./types";

export const zhCN: Locale = {
  Modal: {
    okText: "确定",
    cancelText: "取消",
  },
  Popconfirm: {
    okText: "确定",
    cancelText: "取消",
  },
  Select: {
    placeholder: "请选择",
    searchPlaceholder: "搜索...",
    notFoundContent: "无匹配选项",
  },
  List: {
    emptyText: "暂无数据",
  },
  Empty: {
    description: "暂无数据",
  },
  Upload: {
    uploadText: "上传",
    uploadFile: "上传文件",
    uploading: "上传中…",
    dragHint: "点击或拖拽文件到此区域上传",
  },
  EmojiPicker: {
    title: "点击选择图标",
    clearLabel: "清除",
  },
  Pagination: {
    pageSizeSuffix: "/ 页",
  },
  Form: {
    required: (name) => `${name} 为必填项`,
    invalidUrl: "请输入有效的 URL",
    invalidEmail: "请输入有效的邮箱",
    minLength: (n) => `至少 ${n} 个字符`,
    maxLength: (n) => `最多 ${n} 个字符`,
    patternMismatch: "格式不正确",
    validationFailed: "验证失败",
  },
  DatePicker: {
    datePlaceholder: "选择日期",
    timePlaceholder: "选择时间",
    dateTimePlaceholder: "选择日期时间",
    now: "此刻",
    ok: "确定",
    today: "今天",
    formatYear: (year) => `${year}年`,
    formatMonth: (m) => `${m}月`,
    weekDays: ["日", "一", "二", "三", "四", "五", "六"],
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
