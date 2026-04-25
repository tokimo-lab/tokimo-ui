import { Home, X } from "lucide-react";
import { RightOutlined } from "../icons";
import { PathBar } from "../PathBar";
import { MaterialFileIcon } from "./MaterialFileIcon";

interface FileBreadcrumbProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  /** Source type badge (e.g. "smb", "local") */
  sourceType?: string;
  /** Source address (e.g. "smb://10.0.0.10/media") */
  sourceLabel?: string;
  /** Close callback — renders an X button at the end */
  onClose?: () => void;
}

export function FileBreadcrumb({
  currentPath,
  onNavigate,
  sourceType,
  sourceLabel,
  onClose,
}: FileBreadcrumbProps) {
  const rootLabel = sourceType ? (
    <>
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-[var(--accent-subtle)] text-[var(--accent-text)]">
        {sourceType}
      </span>
      <span className="text-xs font-mono truncate max-w-[280px]">
        {sourceLabel || sourceType}
      </span>
    </>
  ) : (
    <>
      <Home size={13} />
      <span>/</span>
    </>
  );

  const separator = (
    <RightOutlined
      style={{ width: 14, height: 14, color: "var(--text-quaternary)" }}
    />
  );

  return (
    <PathBar
      path={currentPath}
      onNavigate={onNavigate}
      rootLabel={rootLabel}
      separator={separator}
      className="px-1 py-1 select-none"
      renderSegment={(seg, isLast) => (
        <button
          type="button"
          onClick={() => !isLast && onNavigate(seg.path)}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors focus:outline-none hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
          style={{
            color: isLast ? undefined : "var(--text-tertiary)",
            fontWeight: isLast ? 500 : 400,
            cursor: isLast ? "default" : "pointer",
          }}
        >
          <MaterialFileIcon name={seg.name} isDirectory size={13} />
          {seg.name}
        </button>
      )}
      suffix={
        onClose ? (
          <button
            type="button"
            className="shrink-0 p-1 rounded transition-colors cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        ) : undefined
      }
    />
  );
}
