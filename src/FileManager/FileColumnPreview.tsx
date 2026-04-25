/**
 * FileColumnPreview — macOS Finder-style preview panel.
 *
 * Rendered as the rightmost column of FileColumnView when a non-directory
 * file is selected. Shows an inline preview (via renderPreview slot) or
 * a large icon fallback, plus file metadata.
 */

import { useTranslation } from "react-i18next";
import { useDateFormat } from "../dateFormat";
import { MaterialFileIcon } from "./MaterialFileIcon";
import type { FileNode } from "./types";
import { formatDate, formatFileSize, getExtension } from "./types";

const PREVIEW_WIDTH = 280;

interface FileColumnPreviewProps {
  node: FileNode;
  /** Slot: consumer-provided preview renderer.
   *  Return null or undefined to fall back to default icon+metadata display. */
  renderPreview?: (node: FileNode) => React.ReactNode;
}

export function FileColumnPreview({
  node,
  renderPreview,
}: FileColumnPreviewProps) {
  const { t } = useTranslation();
  const { dateFormat } = useDateFormat();
  const ext = getExtension(node.name).toUpperCase();

  const size = node.stat?.size ?? node.size;
  const modifiedAt = node.stat?.modifiedAt ?? node.modifiedAt;

  const customPreview = renderPreview?.(node);

  return (
    <div
      className="shrink-0 h-full border-r border-black/[0.06] dark:border-white/[0.06] flex flex-col"
      style={{ width: PREVIEW_WIDTH }}
    >
      {/* Preview area */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-3 overflow-hidden">
        {customPreview != null ? (
          customPreview
        ) : (
          <div className="flex flex-col items-center gap-2 select-none">
            <MaterialFileIcon
              name={node.name}
              isDirectory={!!node.isDirectory}
              size={96}
            />
            {ext && (
              <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">
                {ext}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="shrink-0 px-3 py-3 border-t border-black/[0.06] dark:border-white/[0.06] space-y-2 text-xs">
        <div
          className="font-medium text-[var(--text-primary)] break-all line-clamp-2"
          title={node.name}
        >
          {node.name}
        </div>
        <MetaRow
          label={t("fileManager.preview.size")}
          value={formatFileSize(size)}
        />
        <MetaRow
          label={t("fileManager.preview.modifiedAt")}
          value={formatDate(modifiedAt, dateFormat)}
        />
        {ext && <MetaRow label={t("fileManager.preview.kind")} value={ext} />}
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="shrink-0 text-[var(--text-quaternary)] min-w-[64px]">
        {label}
      </span>
      <span className="flex-1 min-w-0 text-[var(--text-secondary)] truncate">
        {value}
      </span>
    </div>
  );
}
