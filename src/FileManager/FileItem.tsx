import mime from "mime";
import { useState } from "react";
import { useDateFormat } from "../dateFormat";
import { MaterialFileIcon } from "./MaterialFileIcon";
import type { FileNode } from "./types";
import { formatDate, formatFileSize, getExtension } from "./types";

interface FileItemProps {
  node: FileNode;
  selected: boolean;
  viewMode: "grid" | "list";
  renaming: boolean;
  /** macOS Finder label color (0-7) */
  label?: number;
  /** 是否显示权限和所有者列 */
  showPermissions?: boolean;
  /** When true, show the source storage name column */
  showSource?: boolean;
  /** Called when user clicks the source column — navigate to containing dir */
  onSourceClick?: (node: FileNode) => void;
  /** When true (narrow window), hide all columns except name */
  isNarrow?: boolean;
  /** Highlight the filename in yellow (used for favorites) */
  highlighted?: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRenameSubmit: (name: string) => void;
  onRenameCancel: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

// ─── macOS Finder label colors ───

const FINDER_LABEL_COLORS: Record<number, { fill: string; stroke: string }> = {
  1: { fill: "#8E8E93", stroke: "#636366" }, // Gray
  2: { fill: "#34C759", stroke: "#248A3D" }, // Green
  3: { fill: "#AF52DE", stroke: "#8944AB" }, // Purple
  4: { fill: "#007AFF", stroke: "#0055D4" }, // Blue
  5: { fill: "#FFCC00", stroke: "#D4A600" }, // Yellow
  6: { fill: "#FF9500", stroke: "#CC7700" }, // Orange
  7: { fill: "#FF3B30", stroke: "#CC2F26" }, // Red
};

/** Colored dot indicator for macOS Finder label */
function LabelDot({ label }: { label: number }) {
  const color = FINDER_LABEL_COLORS[label];
  if (!color) return null;
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{
        width: 10,
        height: 10,
        backgroundColor: color.fill,
        boxShadow: `inset 0 0 0 1px ${color.stroke}`,
      }}
    />
  );
}

// ─── MIME type helper ───

function getMimeType(node: FileNode): string {
  if (node.isDirectory) return "";
  const ext = getExtension(node.name);
  if (!ext) return "";
  return mime.getType(ext) ?? "";
}

// ─── Component ───

export function FileItem({
  node,
  selected,
  viewMode,
  renaming,
  label,
  showPermissions,
  showSource = false,
  onSourceClick,
  isNarrow = false,
  highlighted = false,
  onClick,
  onDoubleClick,
  onContextMenu,
  onRenameSubmit,
  onRenameCancel,
  onDragStart,
  onDragEnd,
  onDrop,
  isDragging,
}: FileItemProps) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const { dateFormat } = useDateFormat();
  const isFolder = node.isDirectory;
  const size = node.stat?.size ?? node.size;
  const modifiedAt = node.stat?.modifiedAt ?? node.modifiedAt;

  const handleDragOver = (e: React.DragEvent) => {
    if (!isFolder || !onDrop) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (!isFolder || !onDrop) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDropTarget(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isFolder) return;
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDropTarget(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isFolder || !onDrop) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDropTarget(false);
    onDrop(e);
  };

  const nameRef = (el: HTMLInputElement | null) => {
    if (!el) return;
    // Select stem only, skip extension (Windows Explorer style)
    setTimeout(() => {
      if (!node.isDirectory) {
        const lastDot = node.name.lastIndexOf(".");
        const stemEnd = lastDot > 0 ? lastDot : node.name.length;
        el.setSelectionRange(0, stemEnd);
      } else {
        el.select();
      }
    }, 0);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      const val = e.currentTarget.value.trim();
      if (val) onRenameSubmit(val);
    }
    if (e.key === "Escape") onRenameCancel();
  };

  const handleRenameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.currentTarget.value.trim();
    if (val && val !== node.name) {
      onRenameSubmit(val);
    } else {
      onRenameCancel();
    }
  };

  // ─── Grid view ───
  if (viewMode === "grid") {
    return (
      // biome-ignore lint/a11y/useSemanticElements: draggable div, button doesn't support DnD
      <div
        role="button"
        aria-pressed={selected}
        tabIndex={0}
        draggable={!renaming}
        data-draggable={!renaming || undefined}
        className={[
          "relative flex flex-col items-center gap-1.5 p-2 rounded-lg cursor-pointer select-none transition-colors outline-none",
          isDropTarget
            ? "bg-blue-500/10 ring-2 ring-inset ring-blue-400"
            : selected
              ? "bg-[var(--fill-tertiary)] hover:bg-black/[0.08] dark:hover:bg-white/[0.10]"
              : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]",
        ].join(" ")}
        style={{
          opacity: isDragging ? 0.4 : 1,
        }}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        onKeyDown={(e) => {
          if (e.key === "Enter") onDoubleClick();
        }}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="w-12 h-12 flex items-center justify-center">
          <MaterialFileIcon
            name={node.name}
            isDirectory={!!node.isDirectory}
            size={48}
          />
        </div>
        <div className="w-full flex items-center justify-center gap-1">
          {label ? <LabelDot label={label} /> : null}
          {renaming ? (
            <div className="relative w-full">
              {/* Invisible placeholder keeps the same height as the normal span */}
              <span
                className="text-xs text-center leading-tight line-clamp-2 px-0.5 invisible block pointer-events-none select-none"
                aria-hidden="true"
              >
                {node.name}
              </span>
              <input
                ref={nameRef}
                defaultValue={node.name}
                className="absolute inset-x-0 -top-px -bottom-px text-xs text-center px-1 border border-blue-500 bg-surface-elevated outline-none rounded"
                onKeyDown={handleRenameKeyDown}
                onBlur={handleRenameBlur}
                // biome-ignore lint/a11y/noAutofocus: rename input needs focus
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <span
              className={`text-xs text-center leading-tight line-clamp-2 px-0.5${highlighted ? " text-yellow-500 dark:text-yellow-400" : ""}`}
              title={node.name}
            >
              {node.name}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ─── List view ───
  return (
    // biome-ignore lint/a11y/useSemanticElements: draggable div, button doesn't support DnD
    <div
      role="button"
      aria-pressed={selected}
      tabIndex={0}
      draggable={!renaming}
      data-draggable={!renaming || undefined}
      className={[
        "flex items-center gap-3 px-3 h-full cursor-pointer select-none rounded transition-colors outline-none",
        isDropTarget
          ? "bg-blue-500/10 ring-2 ring-inset ring-blue-400"
          : selected
            ? "bg-[var(--fill-tertiary)] hover:bg-black/[0.08] dark:hover:bg-white/[0.10]"
            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]",
      ].join(" ")}
      style={{
        opacity: isDragging ? 0.4 : 1,
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onKeyDown={(e) => {
        if (e.key === "Enter") onDoubleClick();
      }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className="shrink-0">
        <MaterialFileIcon
          name={node.name}
          isDirectory={!!node.isDirectory}
          size={16}
        />
      </span>
      <span className="flex-1 min-w-0 relative">
        {renaming ? (
          <>
            {/* Invisible placeholder keeps the same height as the normal span */}
            <span
              className="text-sm block invisible pointer-events-none select-none"
              aria-hidden="true"
            >
              {node.name}
            </span>
            <input
              ref={nameRef}
              defaultValue={node.name}
              className="absolute inset-x-0 -top-px -bottom-px text-sm px-1 border border-blue-500 bg-surface-elevated outline-none rounded"
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameBlur}
              // biome-ignore lint/a11y/noAutofocus: rename input needs focus
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </>
        ) : (
          <span className="flex items-center gap-1.5">
            {label ? <LabelDot label={label} /> : null}
            <span
              className={`text-sm truncate${highlighted ? " text-yellow-500 dark:text-yellow-400" : ""}`}
            >
              {node.name}
            </span>
          </span>
        )}
      </span>
      <span
        className={`text-xs w-24 text-right shrink-0 text-[var(--text-tertiary)] truncate${isNarrow ? " hidden" : ""}`}
        title={getMimeType(node)}
      >
        {getMimeType(node)}
      </span>
      {!isNarrow && showSource && (
        <button
          type="button"
          className={`text-xs w-32 text-right shrink-0 truncate transition-colors${onSourceClick ? " text-[var(--accent)] cursor-pointer hover:underline" : " text-[var(--text-tertiary)]"}`}
          title={node.sourceName}
          onClick={
            onSourceClick
              ? (e) => {
                  e.stopPropagation();
                  onSourceClick(node);
                }
              : undefined
          }
        >
          {node.sourceName ?? "—"}
        </button>
      )}
      {!isNarrow && showPermissions && (
        <span className="text-xs w-16 text-right shrink-0 text-[var(--text-tertiary)] tabular-nums font-mono">
          {node.stat?.mode ?? node.mode ?? ""}
        </span>
      )}
      {!isNarrow && showPermissions && (
        <span className="text-xs w-24 text-right shrink-0 text-[var(--text-tertiary)] truncate">
          {/* NOTE: owner field assumed to exist on extended FileNode — consumer responsibility */}
          {(node as unknown as { owner?: string }).owner ?? ""}
        </span>
      )}
      <span
        className={`text-xs w-20 text-right shrink-0 text-[var(--text-tertiary)] tabular-nums${isNarrow ? " hidden" : ""}`}
      >
        {isFolder ? "" : formatFileSize(size)}
      </span>
      <span
        className={`text-xs w-36 text-right shrink-0 text-[var(--text-quaternary)] tabular-nums${isNarrow ? " hidden" : ""}`}
      >
        {formatDate(modifiedAt, dateFormat)}
      </span>
    </div>
  );
}
