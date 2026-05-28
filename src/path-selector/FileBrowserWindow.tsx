import {
  type MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "../Button";
import { MaterialFileIcon } from "../FileManager";
import { ReloadOutlined } from "../icons";
import { PathBar } from "../PathBar";
import { Spin } from "../Spin";
import {
  EntryList,
  type FileStatAdapter,
  type FsEntry,
} from "./FileBrowserList";

export interface VfsBrowseResult {
  currentPath: string;
  parentPath: string | null;
  entries: FsEntry[];
}

export interface FileBrowserVfsApi {
  browse(path: string, sourceId: string | undefined): Promise<VfsBrowseResult>;
  stat: FileStatAdapter;
}

interface FileBrowserWindowProps {
  initialPath?: string;
  sourceId?: string;
  protocolPrefix?: string;
  /** Server local-fs roots ("/" on linux, "/c" "/d" on Windows). */
  roots?: string[];
  vfsApi: FileBrowserVfsApi;
  t: (key: string) => string;
  formatLong?: (value: string | null | undefined) => string;
  onConfirm: (path: string) => void;
  onCancel: () => void;
}

/**
 * FileBrowserWindow — modal window version of the file browser.
 *
 * All paths use Unix-style `/` separators. On Windows the server maps
 * `/c`, `/d` to drives and shows a drive list when browsing `/`.
 */
export default function FileBrowserWindow({
  initialPath: initialPathProp,
  sourceId,
  protocolPrefix,
  roots,
  vfsApi,
  t,
  formatLong,
  onConfirm,
  onCancel,
}: FileBrowserWindowProps) {
  const fallbackInitialPath = sourceId ? "/" : (roots?.[0] ?? "/");
  const initialPath = (initialPathProp ?? "").trim() || fallbackInitialPath;

  // ─── Navigation history (supports mouse side-button back/forward) ───
  const [navHistory, setNavHistory] = useState<string[]>([initialPath]);
  const [navIdx, setNavIdx] = useState(0);
  const navIdxRef = useRef(0);
  const navHistoryRef = useRef<string[]>([initialPath]);
  navIdxRef.current = navIdx;
  navHistoryRef.current = navHistory;
  const browsingPath = navHistory[navIdx] ?? "/";

  const [permissionError, setPermissionError] = useState<string | null>(null);
  const lastGoodPathRef = useRef(initialPath) as MutableRefObject<string>;

  const [browseData, setBrowseData] = useState<VfsBrowseResult | null>(null);
  const [browseIsFetching, setBrowseIsFetching] = useState(false);
  const [browseError, setBrowseError] = useState<Error | null>(null);
  const reqIdRef = useRef(0);

  const runBrowse = useCallback(
    (path: string) => {
      const myReq = ++reqIdRef.current;
      setBrowseIsFetching(true);
      setBrowseError(null);
      vfsApi
        .browse(path, sourceId)
        .then((data) => {
          if (myReq !== reqIdRef.current) return;
          setBrowseData(data);
          setBrowseIsFetching(false);
        })
        .catch((err: Error) => {
          if (myReq !== reqIdRef.current) return;
          setBrowseError(err);
          setBrowseIsFetching(false);
        });
    },
    [vfsApi, sourceId],
  );

  useEffect(() => {
    runBrowse(browsingPath);
  }, [runBrowse, browsingPath]);

  const browseIsError = browseError != null;

  const browseRefetch = useCallback(() => {
    runBrowse(browsingPath);
  }, [runBrowse, browsingPath]);

  const displayEntries = browseData?.entries ?? [];
  const displayParentPath = browseData?.parentPath ?? null;
  const selectedPath = browseData?.currentPath ?? browsingPath;

  useEffect(() => {
    if (browseData) {
      lastGoodPathRef.current = browseData.currentPath;
    }
  }, [browseData]);

  useEffect(() => {
    if (browseIsError && browseError) {
      setPermissionError(browseError.message);
      setNavHistory((prev) => {
        const next = [...prev];
        next[navIdxRef.current] = lastGoodPathRef.current;
        return next;
      });
    }
  }, [browseIsError, browseError]);

  const handleEnterDir = useCallback((dirPath: string) => {
    setPermissionError(null);
    const currentIdx = navIdxRef.current;
    setNavHistory((prev) => [...prev.slice(0, currentIdx + 1), dirPath]);
    setNavIdx(currentIdx + 1);
  }, []);

  const handleBack = useCallback(() => {
    if (navIdxRef.current > 0) {
      setPermissionError(null);
      setNavIdx((prev) => prev - 1);
    }
  }, []);

  const handleForward = useCallback(() => {
    if (navIdxRef.current < navHistoryRef.current.length - 1) {
      setPermissionError(null);
      setNavIdx((prev) => prev + 1);
    }
  }, []);

  // Mouse side-button navigation
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 3) {
        e.preventDefault();
        handleBack();
      } else if (e.button === 4) {
        e.preventDefault();
        handleForward();
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [handleBack, handleForward]);

  const handleConfirm = useCallback(() => {
    let finalPath = selectedPath;
    if (!finalPath) return;
    if (sourceId && !finalPath.endsWith("/")) {
      finalPath = `${finalPath}/`;
    }
    onConfirm(finalPath);
  }, [selectedPath, sourceId, onConfirm]);

  const handleClose = useCallback(() => {
    onCancel();
  }, [onCancel]);

  return (
    <div className="flex flex-col h-full">
      {/* Address bar */}
      <div className="flex items-stretch px-2 py-1.5 border-b border-black/[0.08] dark:border-white/[0.1]">
        <div className="group flex flex-1 min-w-0 h-[26px] rounded border border-black/[0.15] dark:border-white/[0.12] overflow-hidden focus-within:border-blue-500 dark:focus-within:border-blue-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">
          {protocolPrefix && (
            <span className="flex-shrink-0 flex items-center px-2 text-xs font-mono text-fg-muted border-r border-border-base select-none whitespace-nowrap transition-colors">
              {protocolPrefix}
            </span>
          )}
          <PathBar
            path={selectedPath}
            onNavigate={handleEnterDir}
            className="flex-1 min-w-0 h-full px-1.5"
            renderSegment={(seg, isLast) => (
              <button
                type="button"
                className={`flex items-center gap-1 px-1 rounded cursor-pointer hover:bg-black/[0.08] dark:hover:bg-white/[0.1] bg-transparent border-0 text-inherit ${isLast ? "" : "opacity-70 hover:opacity-100"}`}
                onClick={() => handleEnterDir(seg.path)}
              >
                <MaterialFileIcon name={seg.name} isDirectory size={13} />
                <span>{seg.name}</span>
              </button>
            )}
            rootLabel={
              <button
                type="button"
                className="flex items-center gap-1 px-1 rounded cursor-pointer hover:bg-black/[0.08] dark:hover:bg-white/[0.1] bg-transparent border-0 text-inherit"
                onClick={() => handleEnterDir("/")}
              >
                <MaterialFileIcon name="/" isDirectory size={13} />
                <span>/</span>
              </button>
            }
          />
        </div>
      </div>

      {/* Directory listing */}
      <div className="flex-1 min-h-0">
        {browseIsFetching && displayEntries.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Spin size="small" />
          </div>
        ) : (
          <EntryList
            entries={displayEntries}
            parentPath={displayParentPath}
            permissionError={permissionError}
            isFetching={browseIsFetching}
            cacheKey={selectedPath}
            onEnterDir={handleEnterDir}
            t={t}
            sourceId={sourceId}
            statAdapter={vfsApi.stat}
            formatLong={formatLong}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-black/[0.08] dark:border-white/[0.1]">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            title={t("pathSelector.refresh")}
            disabled={browseIsFetching}
            onClick={() => browseRefetch()}
            className="flex items-center justify-center w-6 h-6 rounded text-inherit opacity-50 hover:opacity-100 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] bg-transparent border-0 cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
          >
            <ReloadOutlined
              spin={browseIsFetching}
              style={{ width: 13, height: 13 }}
            />
          </button>
          <span className="text-xs opacity-50 truncate">{selectedPath}</span>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button size="small" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button size="small" variant="primary" onClick={handleConfirm}>
            {t("pathSelector.selectDirectory")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { FileBrowserWindow };
