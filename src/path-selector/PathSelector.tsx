import { useCallback } from "react";
import { Button } from "../Button";
import { Input } from "../Input";
import { FolderOpenOutlined } from "../icons/index";

export interface PathSelectorBrowseArgs {
  initialPath: string;
  sourceId?: string;
  protocolPrefix?: string;
}

interface PathSelectorProps {
  /** 受控 value */
  value?: string;
  /** 值变化回调 */
  onChange?: (value: string) => void;
  /** 输入框占位文本（不传时按 server OS 自动选择） */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 媒体来源 ID（网络文件系统时传入，通过 mediafs 浏览远程目录） */
  sourceId?: string;
  /** 协议前缀（如 smb://host/share 或 nfs://host/export），显示在地址栏顶部 */
  protocolPrefix?: string;
  /** 浏览弹窗的初始路径 */
  browserInitialPath?: string;
  /** 浏览弹窗确认后对路径做转换 */
  onSelectTransform?: (path: string) => string;
  /**
   * 浏览适配器 — host 提供，返回用户选中的路径（或 null = 取消）。
   * 不传时隐藏右侧 Browse 按钮。
   */
  onBrowse?: (args: PathSelectorBrowseArgs) => Promise<string | null>;
  /** Browse 按钮的 title / 提示文案（默认 "Browse"） */
  browseLabel?: string;
  /** sourceId 缺失时的本地 fallback 初始路径 (默认 "/") */
  defaultLocalInitialPath?: string;
}

/**
 * 路径选择器 — VS Code 风格
 *
 * 支持手动输入 + 弹窗浏览服务器文件系统目录。
 * 所有路径使用 Unix 风格（`/` 分隔），server 负责 Windows 盘符转换。
 * 远程 VFS（带 `sourceId`）同样使用 `/` 风格。
 */
export default function PathSelector({
  value = "",
  onChange,
  placeholder,
  disabled = false,
  sourceId,
  protocolPrefix,
  browserInitialPath,
  onSelectTransform,
  onBrowse,
  browseLabel = "Browse",
  defaultLocalInitialPath = "/",
}: PathSelectorProps) {
  const resolvedPlaceholder = placeholder ?? "/mnt/media/";
  const fallbackInitialPath = sourceId ? "/" : defaultLocalInitialPath;

  const handleOpen = useCallback(async () => {
    if (!onBrowse) return;
    const initialPath =
      browserInitialPath ?? value?.trim() ?? fallbackInitialPath;
    const path = await onBrowse({
      initialPath,
      sourceId,
      protocolPrefix,
    });
    if (path == null) return;
    onChange?.(onSelectTransform?.(path) ?? path);
  }, [
    onBrowse,
    browserInitialPath,
    value,
    fallbackInitialPath,
    sourceId,
    protocolPrefix,
    onChange,
    onSelectTransform,
  ]);

  return (
    <div className="flex flex-1 min-w-0 rounded-md border border-black/[0.08] dark:border-white/[0.1] focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)] transition-colors">
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={resolvedPlaceholder}
        disabled={disabled}
        className="flex-1 min-w-0 !rounded-r-none !border-0 !ring-0 focus-within:!border-0 focus-within:!ring-0"
      />
      {onBrowse && (
        <Button
          icon={<FolderOpenOutlined />}
          onClick={handleOpen}
          disabled={disabled}
          title={browseLabel}
          className="!rounded-l-none !border-0 !border-l !border-l-black/[0.08] dark:!border-l-white/[0.1]"
        />
      )}
    </div>
  );
}

export { PathSelector };
