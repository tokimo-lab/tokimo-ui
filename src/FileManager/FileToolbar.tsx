import {
  ArrowUpDown,
  Check,
  Columns3,
  Eye,
  EyeOff,
  FolderPlus,
  LayoutGrid,
  List,
  RefreshCw,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button, Dropdown, type DropdownMenuItem, Tooltip } from "..";
import type { SortBy, SortDir, ViewMode } from "./types";

interface FileToolbarProps {
  viewMode: ViewMode;
  sortBy: SortBy;
  sortDir: SortDir;
  showHidden: boolean;
  isFetching: boolean;
  onNewFolder: () => void;
  onSetViewMode: (mode: ViewMode) => void;
  onSetSortBy: (by: SortBy) => void;
  onSetSortDir: (dir: SortDir) => void;
  onSetShowHidden: (show: boolean) => void;
  onRefresh: () => void;
}

const SORT_KEYS: SortBy[] = ["name", "size", "modifiedAt"];

export function FileToolbar({
  viewMode,
  sortBy,
  sortDir,
  showHidden,
  isFetching,
  onNewFolder,
  onSetViewMode,
  onSetSortBy,
  onSetSortDir,
  onSetShowHidden,
  onRefresh,
}: FileToolbarProps) {
  const { t } = useTranslation();

  const sortLabel = t(`fileManager.sort.${sortBy}`);

  const sortMenuItems: DropdownMenuItem[] = useMemo(() => {
    const fieldItems: DropdownMenuItem[] = SORT_KEYS.map((key) => ({
      key,
      label: t(`fileManager.sort.${key}`),
      icon: sortBy === key ? <Check size={14} /> : <span className="w-3.5" />,
      onClick: () => onSetSortBy(key),
    }));
    const dirItems: DropdownMenuItem[] = [
      {
        key: "asc",
        label: t("fileManager.sort.asc"),
        icon:
          sortDir === "asc" ? <Check size={14} /> : <span className="w-3.5" />,
        onClick: () => onSetSortDir("asc"),
      },
      {
        key: "desc",
        label: t("fileManager.sort.desc"),
        icon:
          sortDir === "desc" ? <Check size={14} /> : <span className="w-3.5" />,
        onClick: () => onSetSortDir("desc"),
      },
    ];
    return [...fieldItems, { type: "divider" }, ...dirItems];
  }, [sortBy, sortDir, t, onSetSortBy, onSetSortDir]);

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0 select-none">
      {/* Left: actions */}
      <Tooltip title={t("fileManager.newFolder")}>
        <Button size="small" onClick={onNewFolder} className="gap-1.5">
          <FolderPlus size={14} />
          <span className="hidden sm:inline">{t("fileManager.newFolder")}</span>
        </Button>
      </Tooltip>

      <div className="flex-1" />

      {/* Right: hidden toggle + sort + view + refresh */}
      <Tooltip
        title={
          showHidden ? t("fileManager.hideHidden") : t("fileManager.showHidden")
        }
      >
        <button
          type="button"
          onClick={() => onSetShowHidden(!showHidden)}
          className="p-1.5 rounded transition-colors cursor-pointer"
          style={{
            color: showHidden
              ? "var(--color-primary-500, #3b82f6)"
              : "var(--text-tertiary)",
            background: showHidden
              ? "var(--color-primary-50, rgba(59,130,246,0.1))"
              : "transparent",
          }}
        >
          {showHidden ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
      </Tooltip>

      <Dropdown
        menu={{ items: sortMenuItems }}
        trigger={["click"]}
        placement="bottomRight"
      >
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors text-[var(--text-tertiary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer"
        >
          <ArrowUpDown size={13} />
          <span>{sortLabel}</span>
          <span>{sortDir === "asc" ? "↑" : "↓"}</span>
        </button>
      </Dropdown>

      <div className="flex rounded-lg border border-black/[0.08] dark:border-white/[0.1] overflow-hidden">
        <Tooltip title={t("fileManager.gridView")}>
          <button
            type="button"
            onClick={() => onSetViewMode("grid")}
            className="px-2 py-1 transition-colors cursor-pointer"
            style={{
              background:
                viewMode === "grid" ? "var(--accent-subtle)" : "transparent",
              color:
                viewMode === "grid"
                  ? "var(--accent-text)"
                  : "var(--text-tertiary)",
            }}
          >
            <LayoutGrid size={13} />
          </button>
        </Tooltip>
        <Tooltip title={t("fileManager.listView")}>
          <button
            type="button"
            onClick={() => onSetViewMode("list")}
            className="px-2 py-1 transition-colors border-l border-black/[0.08] dark:border-white/[0.1] cursor-pointer"
            style={{
              background:
                viewMode === "list" ? "var(--accent-subtle)" : "transparent",
              color:
                viewMode === "list"
                  ? "var(--accent-text)"
                  : "var(--text-tertiary)",
            }}
          >
            <List size={13} />
          </button>
        </Tooltip>
        <Tooltip title={t("fileManager.columnView")}>
          <button
            type="button"
            onClick={() => onSetViewMode("column")}
            className="px-2 py-1 transition-colors border-l border-black/[0.08] dark:border-white/[0.1] cursor-pointer"
            style={{
              background:
                viewMode === "column" ? "var(--accent-subtle)" : "transparent",
              color:
                viewMode === "column"
                  ? "var(--accent-text)"
                  : "var(--text-tertiary)",
            }}
          >
            <Columns3 size={13} />
          </button>
        </Tooltip>
      </div>

      <Tooltip title={t("pathSelector.refresh")}>
        <button
          type="button"
          onClick={onRefresh}
          className="p-1.5 rounded transition-colors text-[var(--text-tertiary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer"
        >
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
        </button>
      </Tooltip>
    </div>
  );
}
