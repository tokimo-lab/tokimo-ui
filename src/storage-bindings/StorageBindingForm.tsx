import { Input } from "../Input";
import {
  PathSelector,
  type PathSelectorBrowseArgs,
} from "../path-selector/PathSelector";
import { Select } from "../Select";

export interface VfsDisplayHints {
  protocolPrefix?: string;
  rootPath?: string;
}

export interface VfsDto {
  id: string;
  name: string;
  type: string;
  /** Server-computed safe display hints (preferred for protocol prefix). */
  displayHints?: VfsDisplayHints;
  /** Legacy raw config — host no longer sends this; kept for back-compat. */
  config?: unknown;
}

const PATH_TYPES = ["local", "nfs", "smb", "webdav", "ftp", "sftp"] as const;
type PathSourceType = (typeof PATH_TYPES)[number];

const BROWSEABLE_CLOUD_TYPES = [
  "115cloud",
  "aliyundrive",
  "baidu_netdisk",
  "quark",
  "uc",
  "123pan",
  "pikpak",
  "thunder",
  "139yun",
  "189cloud",
  "mopan",
  "wopan",
  "lanzou",
  "google_drive",
  "onedrive",
  "dropbox",
  "mega",
  "terabox",
  "yandex_disk",
  "s3",
] as const;

function isPathType(type: string): type is PathSourceType {
  return PATH_TYPES.includes(type as PathSourceType);
}

function isBrowseableType(type: string): boolean {
  return (
    isPathType(type) ||
    BROWSEABLE_CLOUD_TYPES.includes(
      type as (typeof BROWSEABLE_CLOUD_TYPES)[number],
    )
  );
}

function RootPathField({
  sourceId,
  sourceType,
  sourceConfig,
  displayHints,
  value,
  onChange,
  disabled,
  onBrowse,
}: {
  sourceId: string;
  sourceType: string;
  sourceConfig: Record<string, unknown> | null | undefined;
  displayHints?: VfsDisplayHints;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  onBrowse?: (args: PathSelectorBrowseArgs) => Promise<string | null>;
}) {
  const getLocalSourceRoot = () => {
    const fromHint = displayHints?.rootPath?.trim();
    if (fromHint) return fromHint;
    const rawRoot =
      (sourceConfig?.root_folder_path as string | undefined) ||
      (sourceConfig?.path as string | undefined);
    return rawRoot?.trim() || undefined;
  };

  const toLocalBrowserPath = (rawValue: string, localRoot: string) => {
    const trimmed = rawValue.trim();
    if (!trimmed || trimmed === localRoot) return "/";
    if (trimmed.startsWith(`${localRoot}/`))
      return trimmed.slice(localRoot.length);
    return "/";
  };

  const fromLocalBrowserPath = (browserPath: string, localRoot: string) => {
    const trimmed = browserPath.trim();
    if (!trimmed || trimmed === "/") return localRoot;
    return `${localRoot}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
  };

  if (isPathType(sourceType)) {
    let protocolPrefix: string | undefined = displayHints?.protocolPrefix;
    let browserInitialPath: string | undefined;
    let onSelectTransform: ((path: string) => string) | undefined;
    if (!protocolPrefix && sourceType === "smb" && sourceConfig) {
      const host = sourceConfig.host as string | undefined;
      const share = sourceConfig.share as string | undefined;
      const displayShare =
        share && !share.includes(",") && share !== "*" ? share : "";
      if (host) {
        protocolPrefix = `smb://${host}${displayShare ? `/${displayShare}` : ""}`;
      }
    } else if (!protocolPrefix && sourceType === "nfs" && sourceConfig) {
      const host = sourceConfig.host as string | undefined;
      const exportPath = sourceConfig.exportPath as string | undefined;
      if (host) {
        protocolPrefix = `nfs://${host}${exportPath ? `${exportPath}` : ""}`;
      }
    }
    if (sourceType === "local") {
      const localRoot = getLocalSourceRoot();
      if (localRoot) {
        protocolPrefix = protocolPrefix ?? localRoot;
        browserInitialPath = toLocalBrowserPath(value, localRoot);
        onSelectTransform = (path) => fromLocalBrowserPath(path, localRoot);
      }
    }
    return (
      <PathSelector
        value={value}
        onChange={onChange}
        placeholder="/mnt/media/"
        sourceId={sourceId}
        protocolPrefix={protocolPrefix}
        browserInitialPath={browserInitialPath}
        onSelectTransform={onSelectTransform}
        disabled={disabled}
        onBrowse={onBrowse}
      />
    );
  }

  if (isBrowseableType(sourceType)) {
    return (
      <PathSelector
        value={value}
        onChange={onChange}
        placeholder="/"
        sourceId={sourceId}
        disabled={disabled}
        onBrowse={onBrowse}
      />
    );
  }

  return (
    <Input
      placeholder="库 ID / 路径"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  );
}

export interface StorageBindingValue {
  sourceId: string;
  path: string;
}

export interface StorageBindingFormProps {
  sources: VfsDto[];
  value: StorageBindingValue;
  onChange: (next: StorageBindingValue) => void;
  showSourceSelect?: boolean;
  disabled?: boolean;
  onBrowse?: (args: PathSelectorBrowseArgs) => Promise<string | null>;
}

export default function StorageBindingForm({
  sources,
  value,
  onChange,
  showSourceSelect = true,
  disabled = false,
  onBrowse,
}: StorageBindingFormProps) {
  const selectedSource = sources.find((s) => s.id === value.sourceId);

  const handleSourceChange = (sourceId: string) => {
    onChange({ sourceId, path: "" });
  };

  const handlePathChange = (path: string) => {
    onChange({ ...value, path });
  };

  return (
    <div className="space-y-3">
      {showSourceSelect && (
        <div>
          <div className="block text-xs font-medium text-fg-muted mb-1">
            存储源
          </div>
          <Select
            className="w-full"
            options={sources.map((s) => ({
              label: `${s.name} (${s.type})`,
              value: s.id,
            }))}
            value={value.sourceId || undefined}
            onChange={(v) => handleSourceChange(v as string)}
            placeholder="选择存储源"
            disabled={disabled}
          />
        </div>
      )}
      <div>
        <div className="block text-xs font-medium text-fg-muted mb-1">路径</div>
        {value.sourceId ? (
          <RootPathField
            sourceId={value.sourceId}
            sourceType={selectedSource?.type ?? ""}
            sourceConfig={
              selectedSource?.config as
                | Record<string, unknown>
                | null
                | undefined
            }
            displayHints={selectedSource?.displayHints}
            value={value.path}
            onChange={handlePathChange}
            disabled={disabled}
            onBrowse={onBrowse}
          />
        ) : (
          <Input placeholder="请先选择存储源" disabled />
        )}
      </div>
    </div>
  );
}

export { StorageBindingForm };
