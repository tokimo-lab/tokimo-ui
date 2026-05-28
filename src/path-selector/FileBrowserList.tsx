/**
 * Virtualized directory listing used by FileBrowserWindow.
 * Previously lived inside FileBrowserModal; extracted here after the modal
 * was superseded by the native window-modal picker.
 *
 * Host-injected adapters:
 *   - `statAdapter(paths, sourceId?)` — batched stat lookup
 *   - `formatLong(date)` — date formatter (mtime column)
 */

import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";
import { MaterialFileIcon } from "../FileManager";

export interface FsEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

export interface FsStat {
  path: string;
  size?: number | null;
  mode?: string | null;
  modifiedAt?: string | null;
}

export interface FileStatAdapter {
  stat(paths: string[], sourceId?: string): Promise<FsStat[]>;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / 1024 ** i;
  return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${units[i]}`;
}

const ROW_HEIGHT = 28;

interface EntryListProps {
  entries: FsEntry[];
  parentPath: string | null;
  permissionError: string | null;
  isFetching: boolean;
  cacheKey: string;
  onEnterDir: (path: string) => void;
  t: (key: string) => string;
  sourceId?: string;
  statAdapter?: FileStatAdapter;
  formatLong?: (value: string | null | undefined) => string;
}

export function EntryList({
  entries,
  parentPath,
  permissionError,
  isFetching,
  cacheKey,
  onEnterDir,
  t,
  sourceId,
  statAdapter,
  formatLong,
}: EntryListProps) {
  const [statCache, setStatCache] = useState<Map<string, FsStat>>(
    () => new Map(),
  );
  const requestedRef = useRef(new Set<string>());

  // biome-ignore lint/correctness/useExhaustiveDependencies: cacheKey drives reset intentionally
  useEffect(() => {
    setStatCache(new Map());
    requestedRef.current = new Set();
  }, [cacheKey]);

  const rows = parentPath
    ? [
        { kind: "up" as const, path: parentPath },
        ...entries.map((e) => ({ kind: "entry" as const, entry: e })),
      ]
    : entries.map((e) => ({ kind: "entry" as const, entry: e }));

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  useEffect(() => {
    if (!statAdapter) return;
    const pendingPaths = virtualizer
      .getVirtualItems()
      .flatMap((v) => {
        const row = rows[v.index];
        return row?.kind === "entry" ? [row.entry.path] : [];
      })
      .filter((p) => !requestedRef.current.has(p));

    if (pendingPaths.length === 0) return;

    const tid = setTimeout(() => {
      const toFetch = pendingPaths.filter((p) => !requestedRef.current.has(p));
      if (toFetch.length === 0) return;

      for (const p of toFetch) requestedRef.current.add(p);

      const handleStats = (stats: FsStat[]) => {
        setStatCache((prev) => {
          const next = new Map(prev);
          for (const s of stats) next.set(s.path, s);
          return next;
        });
      };
      const handleError = () => {
        for (const p of toFetch) requestedRef.current.delete(p);
      };

      statAdapter.stat(toFetch, sourceId).then(handleStats).catch(handleError);
    }, 150);

    return () => clearTimeout(tid);
  });

  if (rows.length === 0 && !permissionError && !isFetching) {
    return (
      <div className="flex items-center justify-center h-full text-sm opacity-40">
        {t("pathSelector.emptyDirectory")}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-full overflow-y-auto overflow-x-hidden"
      style={{ scrollbarGutter: "stable" }}
    >
      <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-0.5 border-b border-black/[0.06] dark:border-white/[0.06] text-[11px] opacity-50 select-none bg-white/80 dark:bg-[rgba(20,20,35,0.8)] backdrop-blur-sm">
        <span className="w-4 flex-shrink-0" />
        <span className="flex-1 min-w-0">{t("pathSelector.colName")}</span>
        <span className="w-16 text-right">
          {t("pathSelector.colPermissions")}
        </span>
        <span className="w-20 text-right">{t("pathSelector.colSize")}</span>
        <span className="w-24 text-right">{t("pathSelector.colModified")}</span>
      </div>
      {permissionError && (
        <div className="mx-2 mt-1 px-2 py-1 rounded text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20">
          {t("pathSelector.cannotAccess")}
        </div>
      )}
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((vItem) => {
          const row = rows[vItem.index];
          return (
            <div
              key={vItem.key}
              style={{
                position: "absolute",
                top: vItem.start,
                left: 0,
                right: 0,
                height: ROW_HEIGHT,
              }}
            >
              {row.kind === "up" ? (
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 h-full w-full cursor-pointer text-sm hover:bg-black/[0.06] dark:hover:bg-white/[0.08] select-none opacity-60 bg-transparent border-0 text-inherit text-left"
                  onClick={() => onEnterDir(row.path)}
                >
                  <MaterialFileIcon name=".." isDirectory />
                  <span className="flex-1">..</span>
                </button>
              ) : (
                <EntryRow
                  entry={row.entry}
                  stat={statCache.get(row.entry.path)}
                  onEnterDir={onEnterDir}
                  formatLong={formatLong}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EntryRow({
  entry,
  stat,
  onEnterDir,
  formatLong,
}: {
  entry: FsEntry;
  stat?: FsStat;
  onEnterDir: (path: string) => void;
  formatLong?: (value: string | null | undefined) => string;
}) {
  const isDir = entry.isDirectory;
  const content = (
    <>
      {isDir ? (
        <MaterialFileIcon name={entry.name} isDirectory />
      ) : (
        <MaterialFileIcon name={entry.name} />
      )}
      <span className="flex-1 min-w-0 truncate text-sm">{entry.name}</span>
      <span className="w-16 text-right text-xs opacity-40 tabular-nums font-mono flex-shrink-0">
        {stat?.mode ?? "—"}
      </span>
      <span className="w-20 text-right text-xs opacity-60 tabular-nums flex-shrink-0">
        {isDir ? "—" : stat ? formatFileSize(stat.size) : "—"}
      </span>
      <span className="w-24 text-right text-xs opacity-50 tabular-nums flex-shrink-0">
        {stat ? formatLong?.(stat.modifiedAt) || "—" : "—"}
      </span>
    </>
  );

  if (isDir) {
    return (
      <button
        type="button"
        className="flex items-center gap-2 px-3 h-full w-full cursor-pointer hover:bg-black/[0.06] dark:hover:bg-white/[0.08] select-none bg-transparent border-0 text-inherit text-left"
        onClick={() => onEnterDir(entry.path)}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 h-full w-full select-none text-inherit opacity-70">
      {content}
    </div>
  );
}
