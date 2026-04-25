import { ArrowUp } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "../ScrollArea";
import { FileItem } from "./FileItem";
import type { FileNode } from "./types";
import { useMarqueeSelection } from "./useMarqueeSelection";

interface FileGridProps {
  nodes: FileNode[];
  selectedPaths: Set<string>;
  viewMode: "grid" | "list";
  renaming: string | null;
  currentPath: string;
  onNavigateUp?: () => void;
  onItemClick: (node: FileNode, e: React.MouseEvent) => void;
  onItemDoubleClick: (node: FileNode) => void;
  onItemContextMenu: (node: FileNode, e: React.MouseEvent) => void;
  onEmptyContextMenu: (e: React.MouseEvent) => void;
  onRenameSubmit: (path: string, name: string) => void;
  onRenameCancel: () => void;
  onClearSelection: () => void;
  onSelectPaths: (paths: Set<string>) => void;
  onDragStart: (
    node: FileNode,
    contextNodes: FileNode[],
    e: React.DragEvent,
  ) => void;
  onDragEnd: () => void;
  onDropToFolder: (targetNode: FileNode, e: React.DragEvent) => void;
  draggingPaths: Set<string>;
  /** Callback to lazy-load stat info for visible entries */
  onVisibleEntriesChange?: (paths: string[]) => void;
  /** macOS Finder label colors (filename → 0-7) */
  folderLabels?: Record<string, number>;
  /** Paths that should have their name highlighted in yellow */
  highlightedPaths?: Set<string>;
  /** When true (narrow window), hide all columns except name */
  isNarrow?: boolean;
  /** When true, show an extra "来源" (source storage) column */
  showSource?: boolean;
  /** Called when user clicks the source column on an item */
  onSourceClick?: (node: FileNode) => void;
}

const GRID_ITEM_SIZE = 100;
const GRID_GAP = 4;
const LIST_ROW_HEIGHT = 36;

export function FileGrid({
  nodes,
  selectedPaths,
  viewMode,
  renaming,
  currentPath,
  onNavigateUp,
  onItemClick,
  onItemDoubleClick,
  onItemContextMenu,
  onEmptyContextMenu,
  onRenameSubmit,
  onRenameCancel,
  onClearSelection,
  onSelectPaths,
  onDragStart,
  onDragEnd,
  onDropToFolder,
  draggingPaths,
  onVisibleEntriesChange,
  folderLabels,
  highlightedPaths,
  isNarrow = false,
  showSource = false,
  onSourceClick,
}: FileGridProps) {
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const measureRef = useCallback((el: HTMLDivElement | null) => {
    parentRef.current = el;
    if (!el) return;
    setContainerWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─── Marquee (rubber-band) selection ───
  const handleMarqueeSelect = useCallback(
    (paths: Set<string>) => onSelectPaths(paths),
    [onSelectPaths],
  );

  const {
    marquee,
    handleMouseDown: handleMarqueeMouseDown,
    justFinishedRef,
  } = useMarqueeSelection({
    containerRef: parentRef,
    itemSelector: "[data-file-path]",
    onSelect: handleMarqueeSelect,
    disabled: renaming !== null,
  });

  // NOTE: showPermissions checks for mode/owner on extended FileNode interface
  const showPermissions = useMemo(
    () =>
      nodes.some(
        (n) =>
          n.mode || n.stat?.mode || (n as unknown as { owner?: string }).owner,
      ),
    [nodes],
  );

  const COLS =
    viewMode === "grid"
      ? Math.max(
          1,
          Math.floor(
            ((containerWidth || 600) + GRID_GAP) / (GRID_ITEM_SIZE + GRID_GAP),
          ),
        )
      : 1;

  const rowCount =
    viewMode === "grid" ? Math.ceil(nodes.length / COLS) : nodes.length;

  const itemHeight =
    viewMode === "grid" ? GRID_ITEM_SIZE + GRID_GAP : LIST_ROW_HEIGHT;

  const handleRangeChange = useCallback(
    (start: number, end: number) => {
      if (!onVisibleEntriesChange) return;
      const visiblePaths: string[] = [];
      for (let i = start; i <= end; i++) {
        if (viewMode === "grid") {
          for (
            let j = i * COLS;
            j < Math.min(i * COLS + COLS, nodes.length);
            j++
          ) {
            visiblePaths.push(nodes[j].path);
          }
        } else if (nodes[i]) {
          visiblePaths.push(nodes[i].path);
        }
      }
      onVisibleEntriesChange(visiblePaths);
    },
    [COLS, nodes, onVisibleEntriesChange, viewMode],
  );

  const renderRow = useCallback(
    (rowIndex: number) => {
      const rowNodes =
        viewMode === "grid"
          ? nodes.slice(rowIndex * COLS, rowIndex * COLS + COLS)
          : [nodes[rowIndex]];

      return (
        <div
          style={{
            height: "100%",
            display: viewMode === "grid" ? "flex" : "block",
            gap: viewMode === "grid" ? `${GRID_GAP}px` : undefined,
            padding: viewMode === "grid" ? "2px" : undefined,
          }}
        >
          {rowNodes.map((node) =>
            node ? (
              <div
                key={node.path}
                data-file-path={node.path}
                style={
                  viewMode === "grid"
                    ? { width: GRID_ITEM_SIZE, flexShrink: 0 }
                    : { height: "100%" }
                }
              >
                <FileItem
                  node={node}
                  selected={selectedPaths.has(node.path)}
                  viewMode={viewMode}
                  renaming={renaming === node.path}
                  label={folderLabels?.[node.name]}
                  highlighted={highlightedPaths?.has(node.path)}
                  showPermissions={showPermissions}
                  showSource={showSource}
                  onSourceClick={onSourceClick}
                  isNarrow={isNarrow}
                  onClick={(e) => onItemClick(node, e)}
                  onDoubleClick={() => onItemDoubleClick(node)}
                  onContextMenu={(e) => onItemContextMenu(node, e)}
                  onRenameSubmit={(name) => onRenameSubmit(node.path, name)}
                  onRenameCancel={onRenameCancel}
                  isDragging={draggingPaths.has(node.path)}
                  onDragStart={(e) => onDragStart(node, nodes, e)}
                  onDragEnd={onDragEnd}
                  onDrop={
                    node.isDirectory
                      ? (e) => onDropToFolder(node, e)
                      : undefined
                  }
                />
              </div>
            ) : null,
          )}
        </div>
      );
    },
    [
      COLS,
      draggingPaths,
      folderLabels,
      highlightedPaths,
      isNarrow,
      nodes,
      onDragEnd,
      onDragStart,
      onDropToFolder,
      onItemClick,
      onItemContextMenu,
      onItemDoubleClick,
      onRenameCancel,
      onRenameSubmit,
      onSourceClick,
      renaming,
      selectedPaths,
      showPermissions,
      showSource,
      viewMode,
    ],
  );

  const handleContainerClick = (e: React.MouseEvent) => {
    // Skip clearing if a marquee drag just finished
    if (justFinishedRef.current) return;
    if (e.target === e.currentTarget) {
      onClearSelection();
    }
  };

  const handleContainerContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target === e.currentTarget ||
      target.closest("[role='button'][tabindex]") === null
    ) {
      e.preventDefault();
      onEmptyContextMenu(e);
    }
  };

  if (nodes.length === 0) {
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: intentional context menu on empty area
      <div
        className="h-full flex flex-col items-center justify-center gap-2 select-none text-sm text-[var(--text-quaternary)]"
        onContextMenu={(e) => {
          e.preventDefault();
          onEmptyContextMenu(e);
        }}
      >
        <span>{t("fileManager.emptyFolder")}</span>
      </div>
    );
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: click to clear selection
    // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled by parent
    <div
      ref={measureRef}
      className="h-full flex flex-col relative"
      onClick={handleContainerClick}
      onMouseDown={handleMarqueeMouseDown}
      onContextMenu={handleContainerContextMenu}
    >
      {/* Marquee selection overlay — portal to body to bypass ancestor transforms */}
      {marquee &&
        createPortal(
          <div
            className="fixed border border-blue-500/60 bg-blue-500/10 pointer-events-none"
            style={{
              left: marquee.x,
              top: marquee.y,
              width: marquee.width,
              height: marquee.height,
              zIndex: 99999,
            }}
          />,
          document.body,
        )}
      {viewMode === "list" && (
        <div className="flex items-center gap-3 px-3 py-1.5 text-xs font-medium border-b border-black/[0.06] dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm text-[var(--text-tertiary)] shrink-0">
          <span className="w-4 shrink-0" />
          <span className="flex-1">{t("pathSelector.colName")}</span>
          {!isNarrow && (
            <span className="w-24 text-right shrink-0">
              {t("pathSelector.colType")}
            </span>
          )}
          {!isNarrow && showSource && (
            <span className="w-32 text-right shrink-0">
              {t("pathSelector.colSource")}
            </span>
          )}
          {!isNarrow && showPermissions && (
            <span className="w-16 text-right shrink-0">
              {t("pathSelector.colPermissions")}
            </span>
          )}
          {!isNarrow && showPermissions && (
            <span className="w-24 text-right shrink-0">
              {t("pathSelector.colOwner")}
            </span>
          )}
          {!isNarrow && (
            <span className="w-20 text-right shrink-0">
              {t("pathSelector.colSize")}
            </span>
          )}
          {!isNarrow && (
            <span className="w-36 text-right shrink-0">
              {t("pathSelector.colModified")}
            </span>
          )}
        </div>
      )}
      {/* Go up row in list mode */}
      {viewMode === "list" && currentPath !== "/" && onNavigateUp && (
        <button
          type="button"
          className="flex items-center gap-3 px-3 py-1.5 w-full text-left cursor-pointer select-none rounded transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04] shrink-0"
          onClick={onNavigateUp}
        >
          <span className="shrink-0">
            <ArrowUp size={16} className="text-[var(--text-tertiary)]" />
          </span>
          <span className="flex-1 min-w-0 text-sm text-[var(--text-secondary)]">
            ..
          </span>
        </button>
      )}
      <ScrollArea
        className="flex-1 min-h-0"
        itemCount={rowCount}
        itemHeight={itemHeight}
        renderItem={renderRow}
        onRangeChange={handleRangeChange}
        overscan={5}
      />
    </div>
  );
}
