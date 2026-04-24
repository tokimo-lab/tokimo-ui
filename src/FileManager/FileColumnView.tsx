/**
 * macOS Finder-style column view for the file manager.
 *
 * Each column shows directory contents. Clicking a folder reveals its children
 * in the next column. All interactions (selection, context menu, drag & drop,
 * rename) are delegated to the parent FileManager via the same callbacks used
 * by the list/grid views.
 */

import { ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { ScrollArea, type ScrollAreaRef, Spin } from "..";
import { FileColumnPreview } from "./FileColumnPreview";
import { MaterialFileIcon } from "./MaterialFileIcon";
import type { FileNode, SortBy, SortDir } from "./types";
import { sortNodes } from "./types";

// ─── Column data ───

interface ColumnData {
  /** Absolute directory path this column represents */
  path: string;
  /** Loaded entries (sorted, hidden-filtered) */
  nodes: FileNode[];
  /** Loading state */
  isLoading: boolean;
  /** Currently selected path inside this column (at most one) */
  selectedPath: string | null;
}

// ─── Props ───

interface FileColumnViewProps {
  currentPath: string;
  /** Root-column entries (already sorted/filtered by useFileManager) */
  nodes: FileNode[];
  selectedPaths: Set<string>;
  renaming: string | null;
  sortBy: SortBy;
  sortDir: SortDir;
  showHidden: boolean;
  folderLabels?: Record<string, number>;
  highlightedPaths?: Set<string>;
  onNavigate: (path: string) => void;
  /** Called when sub-column navigation happens — syncs win.route without changing fm.currentPath */
  onSyncRoute?: (path: string) => void;
  /** Called whenever the deepest visible column path changes */
  onLeafPathChange?: (path: string) => void;
  /** Custom directory fetcher for sub-columns (returns raw FileNode[]).
   *  Component handles hidden-file filtering and sorting. REQUIRED. */
  fetchDirectory: (dirPath: string) => Promise<FileNode[]>;
  /** Accept external (cross-context) drag payloads? Return false if only internal DnD allowed. */
  acceptsExternalDrop?: (e: React.DragEvent) => boolean;
  /** Handle external drop to dir — called when user drops external payload onto column blank area. */
  onExternalDropToDir?: (dstDirPath: string, e: React.DragEvent) => void;
  onItemClick: (node: FileNode, e: React.MouseEvent) => void;
  onItemDoubleClick: (node: FileNode) => void;
  onItemContextMenu: (node: FileNode, e: React.MouseEvent) => void;
  onEmptyContextMenu: (e: React.MouseEvent) => void;
  onRenameSubmit: (path: string, name: string) => void;
  onRenameCancel: () => void;
  onClearSelection: () => void;
  onDragStart: (
    node: FileNode,
    contextNodes: FileNode[],
    e: React.DragEvent,
  ) => void;
  onDragEnd: () => void;
  onDropToFolder: (targetNode: FileNode, e: React.DragEvent) => void;
  /** Drop onto a column's blank area — targets that column's directory path. */
  onDropToDir: (targetDirPath: string, e: React.DragEvent) => void;
  draggingPaths: Set<string>;
  /** Bump this number to force all open sub-columns to refetch their contents. */
  refreshKey?: number;
  onVisibleEntriesChange?: (paths: string[]) => void;
}

const COLUMN_WIDTH = 240;
const ROW_HEIGHT = 30;

export function FileColumnView({
  currentPath,
  nodes,
  selectedPaths,
  renaming,
  sortBy,
  sortDir,
  showHidden,
  folderLabels,
  highlightedPaths,
  onNavigate,
  onSyncRoute,
  onLeafPathChange,
  fetchDirectory,
  acceptsExternalDrop,
  // NOTE: onExternalDropToDir reserved for future external drop handling, currently unused
  onExternalDropToDir,
  onItemClick,
  onItemDoubleClick,
  onItemContextMenu,
  onEmptyContextMenu,
  onRenameSubmit,
  onRenameCancel,
  onClearSelection,
  onDragStart,
  onDragEnd,
  onDropToFolder,
  onDropToDir,
  draggingPaths,
  refreshKey,
  onVisibleEntriesChange,
}: FileColumnViewProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollAreaRef>(null);

  // columns[0] = currentPath, columns[1..n] = drilled-down sub-dirs
  const [subColumns, setSubColumns] = useState<ColumnData[]>([]);

  // Track which item is selected in the root column
  const [rootSelectedPath, setRootSelectedPath] = useState<string | null>(null);

  // The root column is always derived from `nodes` prop (managed by useFileManager)
  const rootColumn: ColumnData = useMemo(
    () => ({
      path: currentPath,
      nodes,
      isLoading: false,
      selectedPath: null,
    }),
    [currentPath, nodes],
  );

  // Reset sub-columns when the root path changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: currentPath drives reset
  useEffect(() => {
    setSubColumns([]);
  }, [currentPath]);

  const allColumns = useMemo(
    () => [rootColumn, ...subColumns],
    [rootColumn, subColumns],
  );

  // The "leaf path" is the deepest visible column — track and report it to the parent
  const leafPath = allColumns[allColumns.length - 1]?.path ?? currentPath;
  useEffect(() => {
    onLeafPathChange?.(leafPath);
  }, [leafPath, onLeafPathChange]);

  // Auto-scroll to the rightmost column when columns (or preview) change
  // biome-ignore lint/correctness/useExhaustiveDependencies: subColumns.length / preview drives scroll
  useLayoutEffect(() => {
    // Defer to next frame so ScrollArea has measured the new content width
    const raf = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo(Number.MAX_SAFE_INTEGER, 0);
    });
    return () => cancelAnimationFrame(raf);
  }, [subColumns.length, rootSelectedPath]);

  // Report visible entries for stat lazy-loading
  useEffect(() => {
    if (!onVisibleEntriesChange) return;
    const paths = allColumns.flatMap((col) => col.nodes.map((n) => n.path));
    const tid = setTimeout(() => onVisibleEntriesChange(paths), 120);
    return () => clearTimeout(tid);
  });

  const fetchRaw = fetchDirectory;

  // Fetch sub-directory with hidden-file filter + sort
  const fetchColumn = useCallback(
    async (dirPath: string): Promise<FileNode[]> => {
      try {
        const raw = await fetchRaw(dirPath);
        const filtered = raw.filter(
          (e) => showHidden || !e.name.startsWith("."),
        );
        return sortNodes(filtered, sortBy, sortDir);
      } catch {
        return [];
      }
    },
    [fetchRaw, sortBy, sortDir, showHidden],
  );

  // External refresh trigger (e.g. after a same-storage move):
  // refetch all currently-open sub-columns in place.
  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey is the trigger
  useEffect(() => {
    if (refreshKey === undefined || refreshKey === 0) return;
    if (subColumns.length === 0) return;
    const paths = subColumns.map((c) => c.path);
    let cancelled = false;
    Promise.all(paths.map((p) => fetchColumn(p))).then((results) => {
      if (cancelled) return;
      setSubColumns((prev) => {
        // Only update columns whose path still matches what we fetched, to
        // avoid races with concurrent navigation.
        return prev.map((col, idx) => {
          if (idx >= paths.length || col.path !== paths[idx]) return col;
          return { ...col, nodes: results[idx], isLoading: false };
        });
      });
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, fetchColumn]);

  // When a folder is clicked in column at `colIdx`, open its children as the next column
  const handleColumnFolderSelect = useCallback(
    (colIdx: number, node: FileNode) => {
      if (!node.isDirectory) {
        // File selected — trim sub-columns after this column, update selection
        setSubColumns((prev) => {
          const updated = prev.slice(0, colIdx);
          // Update selectedPath for current column
          if (colIdx === 0) {
            // root column — selectedPath is tracked via rootColumn
          } else {
            const col = updated[colIdx - 1];
            if (col) updated[colIdx - 1] = { ...col, selectedPath: node.path };
          }
          return updated;
        });
        return;
      }

      // Directory selected — fetch children and append/replace column
      const placeholder: ColumnData = {
        path: node.path,
        nodes: [],
        isLoading: true,
        selectedPath: null,
      };

      setSubColumns((prev) => {
        const updated = prev.slice(0, colIdx);
        // Update selectedPath on the column that was clicked
        if (colIdx > 0) {
          const col = updated[colIdx - 1];
          if (col) updated[colIdx - 1] = { ...col, selectedPath: node.path };
        }
        updated.push(placeholder);
        return updated;
      });

      // Sync win.route to the navigated path (enables refresh persistence)
      onSyncRoute?.(node.path);

      fetchColumn(node.path).then((entries) => {
        setSubColumns((prev) => {
          const idx = colIdx;
          if (idx >= prev.length) return prev;
          const updated = [...prev];
          updated[idx] = { ...updated[idx], nodes: entries, isLoading: false };
          return updated;
        });
      });
    },
    [fetchColumn, onSyncRoute],
  );

  // Track which item is selected in the root column — see hoisted useState above

  // Reset root selection when path changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: currentPath drives reset
  useEffect(() => {
    setRootSelectedPath(null);
  }, [currentPath]);

  const handleItemClickInColumn = useCallback(
    (colIdx: number, node: FileNode, e: React.MouseEvent) => {
      // Update column-local selection
      if (colIdx === 0) {
        setRootSelectedPath(node.path);
      }

      // Drill into folder to show its contents in the next column
      handleColumnFolderSelect(colIdx, node);

      // Delegate to parent for selection state (selectedPaths)
      onItemClick(node, e);
    },
    [handleColumnFolderSelect, onItemClick],
  );

  const handleItemDoubleClickInColumn = useCallback(
    (_colIdx: number, node: FileNode) => {
      if (node.isDirectory) {
        // Navigate into the directory (replaces root)
        onNavigate(node.path);
      } else {
        onItemDoubleClick(node);
      }
    },
    [onNavigate, onItemDoubleClick],
  );

  const handleEmptyClick = useCallback(
    (colIdx: number, e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        // Trim sub-columns after this column
        setSubColumns((prev) => prev.slice(0, colIdx));
        if (colIdx === 0) setRootSelectedPath(null);
        onClearSelection();
      }
    },
    [onClearSelection],
  );

  const getColumnSelectedPath = (colIdx: number): string | null => {
    if (colIdx === 0) return rootSelectedPath;
    return subColumns[colIdx - 1]?.selectedPath ?? null;
  };

  // Find the currently-selected file node (for the preview column).
  // macOS Finder shows a preview in the rightmost column when a *file* is
  // selected. Directory selections instead drill into the next column.
  const previewNode = useMemo<FileNode | null>(() => {
    for (let i = allColumns.length - 1; i >= 0; i--) {
      const col = allColumns[i];
      const sel =
        i === 0 ? rootSelectedPath : (subColumns[i - 1]?.selectedPath ?? null);
      if (!sel) continue;
      const found = col.nodes.find((n) => n.path === sel);
      if (found && !found.isDirectory) return found;
      // selection found but it's a directory (which already drilled in) —
      // no preview needed at this level; keep looking upward
    }
    return null;
  }, [allColumns, rootSelectedPath, subColumns]);

  if (nodes.length === 0) {
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: intentional context menu on empty area
      <div
        className="h-full flex items-center justify-center text-sm text-[var(--text-quaternary)] select-none"
        onContextMenu={(e) => {
          e.preventDefault();
          onEmptyContextMenu(e);
        }}
      >
        {t("fileManager.emptyFolder")}
      </div>
    );
  }

  return (
    <ScrollArea
      ref={scrollRef}
      direction="horizontal"
      className="h-full"
      innerClassName="h-full"
    >
      <div className="flex h-full">
        {allColumns.map((col, colIdx) => (
          <Column
            key={col.path}
            column={col}
            selectedPaths={selectedPaths}
            columnSelectedPath={getColumnSelectedPath(colIdx)}
            renaming={renaming}
            folderLabels={folderLabels}
            highlightedPaths={highlightedPaths}
            draggingPaths={draggingPaths}
            acceptsExternalDrop={acceptsExternalDrop}
            onItemClick={(node, e) => handleItemClickInColumn(colIdx, node, e)}
            onItemDoubleClick={(node) =>
              handleItemDoubleClickInColumn(colIdx, node)
            }
            onItemContextMenu={onItemContextMenu}
            onEmptyContextMenu={onEmptyContextMenu}
            onEmptyClick={(e) => handleEmptyClick(colIdx, e)}
            onRenameSubmit={onRenameSubmit}
            onRenameCancel={onRenameCancel}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDropToFolder={onDropToFolder}
            onDropToDir={onDropToDir}
          />
        ))}
        {previewNode && (
          <FileColumnPreview
            key={`preview:${previewNode.path}`}
            node={previewNode}
          />
        )}
      </div>
    </ScrollArea>
  );
}

// ─── Single Column ───

interface ColumnProps {
  column: ColumnData;
  selectedPaths: Set<string>;
  columnSelectedPath: string | null;
  renaming: string | null;
  folderLabels?: Record<string, number>;
  highlightedPaths?: Set<string>;
  draggingPaths: Set<string>;
  acceptsExternalDrop?: (e: React.DragEvent) => boolean;
  onItemClick: (node: FileNode, e: React.MouseEvent) => void;
  onItemDoubleClick: (node: FileNode) => void;
  onItemContextMenu: (node: FileNode, e: React.MouseEvent) => void;
  onEmptyContextMenu: (e: React.MouseEvent) => void;
  onEmptyClick: (e: React.MouseEvent) => void;
  onRenameSubmit: (path: string, name: string) => void;
  onRenameCancel: () => void;
  onDragStart: (
    node: FileNode,
    contextNodes: FileNode[],
    e: React.DragEvent,
  ) => void;
  onDragEnd: () => void;
  onDropToFolder: (targetNode: FileNode, e: React.DragEvent) => void;
  onDropToDir: (targetDirPath: string, e: React.DragEvent) => void;
}

function Column({
  column,
  selectedPaths,
  columnSelectedPath,
  renaming,
  folderLabels,
  highlightedPaths,
  draggingPaths,
  acceptsExternalDrop,
  onItemClick,
  onItemDoubleClick,
  onItemContextMenu,
  onEmptyContextMenu,
  onEmptyClick,
  onRenameSubmit,
  onRenameCancel,
  onDragStart,
  onDragEnd,
  onDropToFolder,
  onDropToDir,
}: ColumnProps) {
  const { t } = useTranslation();

  // Column-level drag-over visual + drop forwarding to the column's directory
  const [isColumnDropTarget, setIsColumnDropTarget] = useState(false);
  const columnDragEnterCount = useRef(0);

  const handleColumnDragOver = (e: React.DragEvent) => {
    // Show drop affordance if there's a Tokimo payload OR native files.
    const hasPayload = acceptsExternalDrop?.(e) ?? false;
    const hasFiles = e.dataTransfer.types.includes("Files");
    if (!hasPayload && !hasFiles) return;
    e.preventDefault();
    // Prevent the FileManager root container from also highlighting.
    e.stopPropagation();
    e.dataTransfer.dropEffect = hasPayload ? "move" : "copy";
  };
  const handleColumnDragEnter = (e: React.DragEvent) => {
    const hasPayload = acceptsExternalDrop?.(e) ?? false;
    const hasFiles = e.dataTransfer.types.includes("Files");
    if (!hasPayload && !hasFiles) return;
    e.preventDefault();
    e.stopPropagation();
    columnDragEnterCount.current++;
    setIsColumnDropTarget(true);
  };
  const handleColumnDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      columnDragEnterCount.current = 0;
      setIsColumnDropTarget(false);
      return;
    }
    columnDragEnterCount.current--;
    if (columnDragEnterCount.current <= 0) {
      columnDragEnterCount.current = 0;
      setIsColumnDropTarget(false);
    }
  };
  const handleColumnDrop = (e: React.DragEvent) => {
    columnDragEnterCount.current = 0;
    setIsColumnDropTarget(false);
    // Stop propagation so the FileManager root container drop handler
    // doesn't re-process this drop with the wrong target directory.
    e.stopPropagation();
    e.preventDefault();
    onDropToDir(column.path, e);
  };

  if (column.isLoading) {
    return (
      <div
        className="shrink-0 h-full flex items-center justify-center border-r border-black/[0.06] dark:border-white/[0.06]"
        style={{ width: COLUMN_WIDTH }}
      >
        <Spin size="small" />
      </div>
    );
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: click to clear selection
    // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled by parent
    <div
      className={[
        "shrink-0 h-full border-r border-black/[0.06] dark:border-white/[0.06] relative transition-colors",
        isColumnDropTarget
          ? "bg-blue-500/5 ring-2 ring-inset ring-blue-400/60"
          : "",
      ].join(" ")}
      style={{ width: COLUMN_WIDTH }}
      onClick={onEmptyClick}
      onContextMenu={(e) => {
        const target = e.target as HTMLElement;
        if (
          target === e.currentTarget ||
          target.closest("[role='button'][tabindex]") === null
        ) {
          e.preventDefault();
          onEmptyContextMenu(e);
        }
      }}
      onDragOver={handleColumnDragOver}
      onDragEnter={handleColumnDragEnter}
      onDragLeave={handleColumnDragLeave}
      onDrop={handleColumnDrop}
    >
      {column.nodes.length === 0 ? (
        <div className="h-full flex items-center justify-center text-xs text-[var(--text-quaternary)] select-none">
          {t("fileManager.emptyFolder")}
        </div>
      ) : (
        <ScrollArea
          className="h-full"
          itemCount={column.nodes.length}
          itemHeight={ROW_HEIGHT}
          overscan={8}
          renderItem={(index) => {
            const node = column.nodes[index];
            return (
              <ColumnItem
                node={node}
                selected={selectedPaths.has(node.path)}
                isColumnSelected={columnSelectedPath === node.path}
                isRenaming={renaming === node.path}
                label={folderLabels?.[node.name]}
                highlighted={highlightedPaths?.has(node.path)}
                isDragging={draggingPaths.has(node.path)}
                onClick={(e) => onItemClick(node, e)}
                onDoubleClick={() => onItemDoubleClick(node)}
                onContextMenu={(e) => onItemContextMenu(node, e)}
                onRenameSubmit={(name) => onRenameSubmit(node.path, name)}
                onRenameCancel={onRenameCancel}
                onDragStart={(e) => onDragStart(node, column.nodes, e)}
                onDragEnd={onDragEnd}
                onDrop={
                  node.isDirectory ? (e) => onDropToFolder(node, e) : undefined
                }
              />
            );
          }}
        />
      )}
    </div>
  );
}

// ─── Column Item ───

const FINDER_LABEL_COLORS: Record<number, { fill: string; stroke: string }> = {
  1: { fill: "#8E8E93", stroke: "#636366" },
  2: { fill: "#34C759", stroke: "#248A3D" },
  3: { fill: "#AF52DE", stroke: "#8944AB" },
  4: { fill: "#007AFF", stroke: "#0055D4" },
  5: { fill: "#FFCC00", stroke: "#D4A600" },
  6: { fill: "#FF9500", stroke: "#CC7700" },
  7: { fill: "#FF3B30", stroke: "#CC2F26" },
};

interface ColumnItemProps {
  node: FileNode;
  selected: boolean;
  isColumnSelected: boolean;
  isRenaming: boolean;
  label?: number;
  highlighted?: boolean;
  isDragging?: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRenameSubmit: (name: string) => void;
  onRenameCancel: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDrop?: (e: React.DragEvent) => void;
}

function ColumnItem({
  node,
  selected,
  isColumnSelected,
  isRenaming,
  label,
  highlighted,
  isDragging,
  onClick,
  onDoubleClick,
  onContextMenu,
  onRenameSubmit,
  onRenameCancel,
  onDragStart,
  onDragEnd,
  onDrop,
}: ColumnItemProps) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const isFolder = node.isDirectory;

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
    if (!e.currentTarget.contains(e.relatedTarget as Node))
      setIsDropTarget(false);
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
    if (e.key === "Enter") {
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

  const labelColor = label ? FINDER_LABEL_COLORS[label] : null;

  return (
    // biome-ignore lint/a11y/useSemanticElements: draggable div
    <div
      role="button"
      aria-pressed={selected}
      tabIndex={0}
      draggable={!isRenaming}
      data-draggable={!isRenaming || undefined}
      data-file-path={node.path}
      className={[
        "flex items-center gap-2 px-2 cursor-pointer select-none transition-colors outline-none",
        isDropTarget
          ? "bg-blue-500/10 ring-2 ring-inset ring-blue-400"
          : selected || isColumnSelected
            ? "bg-[var(--fill-tertiary)] hover:bg-black/[0.08] dark:hover:bg-white/[0.10]"
            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]",
      ].join(" ")}
      style={{
        height: ROW_HEIGHT,
        opacity: isDragging ? 0.4 : 1,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
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

      {labelColor && (
        <span
          className="inline-block shrink-0 rounded-full"
          style={{
            width: 8,
            height: 8,
            backgroundColor: labelColor.fill,
            boxShadow: `inset 0 0 0 1px ${labelColor.stroke}`,
          }}
        />
      )}

      <span className="flex-1 min-w-0 relative">
        {isRenaming ? (
          <>
            <span
              className="text-xs block invisible pointer-events-none select-none"
              aria-hidden="true"
            >
              {node.name}
            </span>
            <input
              ref={nameRef}
              defaultValue={node.name}
              className="absolute inset-x-0 -top-px -bottom-px text-xs px-1 border border-blue-500 bg-surface-elevated outline-none rounded"
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameBlur}
              // biome-ignore lint/a11y/noAutofocus: rename input needs focus
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </>
        ) : (
          <span
            className={`text-xs truncate block${highlighted ? " text-yellow-500 dark:text-yellow-400" : ""}`}
            title={node.name}
          >
            {node.name}
          </span>
        )}
      </span>

      {isFolder && (
        <ChevronRight
          size={12}
          className="shrink-0 text-[var(--text-quaternary)]"
        />
      )}
    </div>
  );
}
