/**
 * useInlineRename — generic inline-rename behavior for file lists.
 *
 * Used by Finder (VFS), SSH Terminal, and Agent workspace browser.
 * Each consumer injects its own `renameFn` (different APIs / path semantics).
 *
 * Two modes:
 * - **Uncontrolled**: hook owns `renaming` state.
 * - **Controlled**: pass `renaming` + `setRenaming` from outside (e.g. Finder
 *   stores it in `useFileManager` so multiple call-sites stay in sync).
 */

import { useCallback, useRef, useState } from "react";

export interface UseInlineRenameOptions {
  /**
   * Async rename operation. Receives the original path and the new basename.
   * Throwing leaves the row in editing mode so the user can fix the input.
   */
  renameFn: (oldPath: string, newName: string) => Promise<void>;
  /** Called after a successful rename — typically to refresh the listing. */
  onSuccess?: () => void;
  /** Click → click delay (ms) before entering rename mode. Default 600. */
  delayMs?: number;
  /** Read-only mode: scheduleRename is a no-op. */
  readOnly?: boolean;
  /** Controlled mode: external state holder. Provide both fields together. */
  renaming?: string | null;
  setRenaming?: (path: string | null) => void;
}

export interface UseInlineRenameReturn {
  /** The path currently being inline-edited (null if none). */
  renaming: string | null;
  /** Imperatively enter rename mode (e.g. from a context-menu item). */
  startRename: (path: string) => void;
  /** Cancel any pending scheduled rename. */
  cancelRenameTimer: () => void;
  /**
   * Schedule rename after `delayMs`. Call on click after a previous selection
   * (the FileItem usually only triggers this for already-selected rows).
   */
  scheduleRename: (path: string) => void;
  /** Submit a new basename. Calls `renameFn`; clears state on success. */
  handleSubmit: (oldPath: string, newName: string) => void;
  /** Cancel the editing UI without submitting. */
  handleCancel: () => void;
  /** True while `renameFn` is in flight. */
  isPending: boolean;
}

export function useInlineRename({
  renameFn,
  onSuccess,
  delayMs = 600,
  readOnly = false,
  renaming: controlledRenaming,
  setRenaming: controlledSetRenaming,
}: UseInlineRenameOptions): UseInlineRenameReturn {
  const isControlled =
    controlledRenaming !== undefined && controlledSetRenaming !== undefined;
  const [internalRenaming, setInternalRenaming] = useState<string | null>(null);
  const renaming = isControlled ? (controlledRenaming ?? null) : internalRenaming;
  const setRenaming = useCallback(
    (path: string | null) => {
      if (isControlled) controlledSetRenaming?.(path);
      else setInternalRenaming(path);
    },
    [isControlled, controlledSetRenaming],
  );

  const [isPending, setIsPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelRenameTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleRename = useCallback(
    (path: string) => {
      if (readOnly) return;
      cancelRenameTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setRenaming(path);
      }, delayMs);
    },
    [readOnly, delayMs, cancelRenameTimer, setRenaming],
  );

  const startRename = useCallback(
    (path: string) => {
      if (readOnly) return;
      cancelRenameTimer();
      setRenaming(path);
    },
    [readOnly, cancelRenameTimer, setRenaming],
  );

  const handleCancel = useCallback(() => {
    cancelRenameTimer();
    setRenaming(null);
  }, [cancelRenameTimer, setRenaming]);

  const handleSubmit = useCallback(
    (oldPath: string, newName: string) => {
      const trimmed = newName.trim();
      const oldName = oldPath.split("/").pop() ?? "";
      if (!trimmed || trimmed === oldName) {
        setRenaming(null);
        return;
      }
      setIsPending(true);
      renameFn(oldPath, trimmed)
        .then(() => {
          setRenaming(null);
          onSuccess?.();
        })
        .catch(() => {
          // Leave editing mode active so user can retry or cancel manually.
        })
        .finally(() => setIsPending(false));
    },
    [renameFn, onSuccess, setRenaming],
  );

  return {
    renaming,
    startRename,
    cancelRenameTimer,
    scheduleRename,
    handleSubmit,
    handleCancel,
    isPending,
  };
}
