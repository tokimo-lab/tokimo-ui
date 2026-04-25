/** 通用文件管理器类型定义 + 工具函数 */

import dayjs from "dayjs";

// ─── 文件节点接口（兼容 FsEntry + FsStat 结构）───

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number | null;
  modifiedAt?: string | null;
  mode?: number | null;
  stat?: {
    size?: number | null;
    modifiedAt?: string | null;
    mode?: number | null;
  };
  /** 显示用的来源存储名称（仅收藏夹视图使用） */
  sourceName?: string;
}

export type ViewMode = "grid" | "list" | "column";
export type SortBy = "name" | "size" | "modifiedAt";
export type SortDir = "asc" | "desc";

export interface ClipboardEntry {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
}

export interface Clipboard {
  paths: string[];
  entries: ClipboardEntry[];
  mode: "copy" | "cut";
  /** Source file system ID (for cross-storage paste). */
  fileSystemId: string;
  /** Human-readable source label (e.g. "smb://10.0.0.1/media"). */
  sourceLabel: string;
}

// ─── Content type 推断 ───

const EXT_TO_CONTENT_TYPE: Record<string, string> = {
  // 图片
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  ico: "image/x-icon",
  avif: "image/avif",
  // 视频
  mp4: "video/mp4",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  webm: "video/webm",
  mov: "video/quicktime",
  wmv: "video/x-ms-wmv",
  flv: "video/x-flv",
  ts: "video/mp2t",
  m4v: "video/x-m4v",
  // 音频
  mp3: "audio/mpeg",
  flac: "audio/flac",
  aac: "audio/aac",
  wav: "audio/wav",
  ogg: "audio/ogg",
  wma: "audio/x-ms-wma",
  m4a: "audio/mp4",
  opus: "audio/opus",
  // 文档
  pdf: "application/pdf",
  epub: "application/epub+zip",
  mobi: "application/x-mobipocket-ebook",
  azw3: "application/x-mobi8-ebook",
  azw: "application/x-mobipocket-ebook",
  prc: "application/x-mobipocket-ebook",
  // 文本 / 代码
  txt: "text/plain",
  md: "text/markdown",
  json: "application/json",
  xml: "text/xml",
  yml: "text/yaml",
  yaml: "text/yaml",
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
  jsx: "text/javascript",
  tsx: "text/typescript",
  py: "text/x-python",
  go: "text/x-go",
  java: "text/x-java",
  rs: "text/x-rust",
  sql: "text/x-sql",
  sh: "text/x-shellscript",
  log: "text/plain",
  conf: "text/plain",
  ini: "text/plain",
  toml: "text/plain",
  // 压缩
  zip: "application/zip",
  tar: "application/x-tar",
  gz: "application/gzip",
  "7z": "application/x-7z-compressed",
  rar: "application/x-rar-compressed",
  // 字幕
  srt: "text/plain",
  ass: "text/plain",
  ssa: "text/plain",
  sub: "text/plain",
  // NFO
  nfo: "text/plain",
};

export function getExtension(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? (parts.at(-1) ?? "") : "";
}

export function guessContentType(name: string): string | null {
  return EXT_TO_CONTENT_TYPE[getExtension(name)] ?? null;
}

export function isImageType(ct: string | null): boolean {
  return ct?.startsWith("image/") ?? false;
}

export function isVideoType(ct: string | null): boolean {
  return ct?.startsWith("video/") ?? false;
}

export function isAudioType(ct: string | null): boolean {
  return ct?.startsWith("audio/") ?? false;
}

export function isPdfType(ct: string | null): boolean {
  return ct === "application/pdf";
}

const MOBI_EXTENSIONS = new Set(["mobi", "azw3", "azw", "prc"]);

export function isMobiFile(name: string): boolean {
  return MOBI_EXTENSIONS.has(getExtension(name));
}

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "json",
  "xml",
  "yml",
  "yaml",
  "html",
  "css",
  "js",
  "jsx",
  "tsx",
  "py",
  "go",
  "java",
  "rs",
  "sql",
  "sh",
  "log",
  "conf",
  "ini",
  "toml",
  "srt",
  "ass",
  "ssa",
  "sub",
  "nfo",
]);

export function isTextFile(name: string): boolean {
  return TEXT_EXTENSIONS.has(getExtension(name));
}

export function isPreviewable(name: string): boolean {
  const ct = guessContentType(name);
  return (
    isImageType(ct) ||
    isVideoType(ct) ||
    isAudioType(ct) ||
    isPdfType(ct) ||
    getExtension(name) === "epub" ||
    isMobiFile(name) ||
    isTextFile(name)
  );
}

export type PreviewKind =
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "epub"
  | "mobi"
  | "text"
  | "none";

export function getPreviewKind(name: string): PreviewKind {
  const ct = guessContentType(name);
  if (isImageType(ct)) return "image";
  if (isVideoType(ct)) return "video";
  if (isAudioType(ct)) return "audio";
  if (isPdfType(ct)) return "pdf";
  if (getExtension(name) === "epub") return "epub";
  if (isMobiFile(name)) return "mobi";
  if (isTextFile(name)) return "text";
  return "none";
}

// ─── 压缩文件检测 ───

const ARCHIVE_EXTENSIONS = new Set([
  "zip",
  "tar",
  "gz",
  "tgz",
  "bz2",
  "tbz2",
  "xz",
  "txz",
  "zst",
  "tzst",
  "7z",
  "rar",
]);

export function isArchiveFile(name: string): boolean {
  const lower = name.toLowerCase();
  // Check compound extensions first
  if (
    lower.endsWith(".tar.gz") ||
    lower.endsWith(".tar.bz2") ||
    lower.endsWith(".tar.xz") ||
    lower.endsWith(".tar.zst")
  ) {
    return true;
  }
  return ARCHIVE_EXTENSIONS.has(getExtension(lower));
}

// ─── 格式化工具 ───

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / 1024 ** i;
  return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${units[i]}`;
}

// NOTE: formatDate now requires explicit format parameter (no DEFAULT_DATE_FORMAT dependency)
export function formatDate(
  iso: string | null | undefined,
  fmt: string,
): string {
  if (!iso) return "—";
  const d = dayjs(iso);
  return d.isValid() ? d.format(fmt) : "—";
}

// ─── 排序 ───

export function sortNodes(
  nodes: FileNode[],
  sortBy: SortBy,
  sortDir: SortDir,
): FileNode[] {
  const dirs = nodes.filter((n) => n.isDirectory);
  const files = nodes.filter((n) => !n.isDirectory);

  const comparator = (a: FileNode, b: FileNode): number => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortBy) {
      case "name":
        return dir * a.name.localeCompare(b.name, "zh-CN", { numeric: true });
      case "size": {
        const sa = a.stat?.size ?? a.size ?? -1;
        const sb = b.stat?.size ?? b.size ?? -1;
        return dir * (sa - sb);
      }
      case "modifiedAt": {
        const ma = a.stat?.modifiedAt ?? a.modifiedAt ?? "";
        const mb = b.stat?.modifiedAt ?? b.modifiedAt ?? "";
        return dir * ma.localeCompare(mb);
      }
      default:
        return 0;
    }
  };

  dirs.sort(comparator);
  files.sort(comparator);
  return [...dirs, ...files];
}

// ─── 路径工具 ───

export function getParentPath(p: string): string {
  if (p === "/" || !p) return "/";
  const trimmed = p.endsWith("/") ? p.slice(0, -1) : p;
  const lastSlash = trimmed.lastIndexOf("/");
  return lastSlash <= 0 ? "/" : trimmed.slice(0, lastSlash);
}

export function joinPath(base: string, name: string): string {
  const b = base.endsWith("/") ? base : `${base}/`;
  return `${b}${name}`;
}
