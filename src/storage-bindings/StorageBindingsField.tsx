import { CheckCircle, FolderOpen, HardDrive } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../Button";
import { Form } from "../Form";
import { Input } from "../Input";
import { DeleteOutlined, PlusOutlined } from "../icons";
import type { PathSelectorBrowseArgs } from "../path-selector/PathSelector";
import { Tag } from "../Tag";
import { cn } from "../utils";
import StorageBindingForm, { type VfsDto } from "./StorageBindingForm";

export type VideoBinding = {
  _key: number;
  sourceId: string;
  rootPath: string;
  isDefaultDownload: boolean;
};

/** Alias for the same shape — preferred name going forward. */
export type StorageBinding = VideoBinding;

function BindingCard({
  binding,
  index,
  sources,
  onUpdate,
  onRemove,
  onSetDefault,
  hideDefaultToggle = false,
  hideRemove = false,
  browse,
}: {
  binding: VideoBinding;
  index: number;
  sources: VfsDto[];
  onUpdate: (index: number, patch: Partial<VideoBinding>) => void;
  onRemove: (index: number) => void;
  onSetDefault: (index: number) => void;
  hideDefaultToggle?: boolean;
  hideRemove?: boolean;
  browse: (args: PathSelectorBrowseArgs) => Promise<string | null>;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        binding.isDefaultDownload && !hideDefaultToggle
          ? "border-green-300 dark:border-green-700 bg-green-50/40 dark:bg-green-950/15"
          : "border-border-base bg-white/50 dark:bg-white/[0.02]",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag color="success" className="text-xs">
            {t("storageBindings.fileSource", "文件来源")}
          </Tag>
          {!hideDefaultToggle && binding.isDefaultDownload && (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <CheckCircle className="w-3 h-3" />
              {t("storageBindings.defaultDownload", "默认下载位置")}
            </span>
          )}
        </div>
        {!hideRemove && (
          <Button
            variant="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => onRemove(index)}
          />
        )}
      </div>

      <StorageBindingForm
        sources={sources}
        value={{ sourceId: binding.sourceId, path: binding.rootPath }}
        onChange={({ sourceId, path }) =>
          onUpdate(index, { sourceId, rootPath: path })
        }
        onBrowse={browse}
      />

      {!hideDefaultToggle && !binding.isDefaultDownload && (
        <div className="mt-3 pt-3 border-t border-border-base">
          <button
            type="button"
            onClick={() => onSetDefault(index)}
            className="text-xs text-fg-muted hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
          >
            {t("storageBindings.setDefaultDownload", "设为默认下载位置")}
          </button>
        </div>
      )}
    </div>
  );
}

export interface PickedBinding {
  sourceId: string;
  path: string;
}

/** Minimal shell interface — avoids hard dependency on @tokimo/sdk. */
export interface StorageShellApi {
  pickFilePath: (params?: {
    sourceId?: string;
    initialPath?: string;
  }) => Promise<string | null>;
  pickStorageBinding?: (params?: {
    initial?: { sourceId?: string; path?: string };
  }) => Promise<PickedBinding | null>;
}

export default function StorageBindingsField({
  sources,
  form,
  initialSources,
  minBindings = 0,
  maxBindings,
  onBrowse: onBrowseProp,
  shell,
}: {
  sources: VfsDto[];
  form: ReturnType<typeof Form.useForm>[0];
  initialSources?: Array<{
    sourceId: string;
    rootPath: string;
    isDefaultDownload?: boolean | null;
  }>;
  minBindings?: number;
  maxBindings?: number;
  /** @deprecated Use `shell` instead. Kept for backward compatibility. */
  onBrowse?: (args: PathSelectorBrowseArgs) => Promise<string | null>;
  /** Shell API for built-in browse. When provided, browse buttons appear automatically. */
  shell?: StorageShellApi;
}) {
  const { t } = useTranslation();
  const nextKeyRef = useRef(0);

  // Built-in browse: use shell.pickFilePath for path browsing, fallback to onBrowse prop
  const browse = useCallback(
    (args: PathSelectorBrowseArgs) =>
      shell?.pickFilePath({
        sourceId: args.sourceId,
        initialPath: args.initialPath,
      }) ??
      onBrowseProp?.(args) ??
      Promise.resolve(null),
    [shell, onBrowseProp],
  );
  const [bindings, setBindings] = useState<VideoBinding[]>([]);
  const initializedRef = useRef(false);

  const sync = useCallback(
    (next: VideoBinding[]) => {
      setBindings(next);
      form.setFieldValue("bindings", next);
    },
    [form],
  );

  useEffect(() => {
    // Wait until initialSources is actually provided (not undefined) before
    // initializing.  This avoids a race where the effect fires before the
    // parent's async data has loaded, locking out the real sources.
    if (initializedRef.current || initialSources === undefined) return;
    initializedRef.current = true;
    const items: VideoBinding[] = initialSources.map((s) => ({
      _key: nextKeyRef.current++,
      sourceId: s.sourceId,
      rootPath: s.rootPath,
      isDefaultDownload: s.isDefaultDownload ?? false,
    }));
    // If minBindings > items.length, pad with empty slots
    while (items.length < minBindings) {
      items.push({
        _key: nextKeyRef.current++,
        sourceId: "",
        rootPath: "",
        isDefaultDownload: items.length === 0,
      });
    }
    sync(items);
  }, [initialSources, sync, minBindings]);

  // Auto-initialize with empty slots when minBindings > 0 and no initialSources
  useEffect(() => {
    if (initializedRef.current) return;
    if (initialSources !== undefined) return; // will be handled by the other effect
    if (minBindings <= 0) return;
    initializedRef.current = true;
    const items: VideoBinding[] = Array.from(
      { length: minBindings },
      (_, i) => ({
        _key: nextKeyRef.current++,
        sourceId: "",
        rootPath: "",
        isDefaultDownload: i === 0,
      }),
    );
    sync(items);
  }, [initialSources, minBindings, sync]);

  const addEmpty = useCallback(() => {
    const hasDefault = bindings.some((b) => b.isDefaultDownload);
    sync([
      ...bindings,
      {
        _key: nextKeyRef.current++,
        sourceId: "",
        rootPath: "",
        isDefaultDownload: !hasDefault,
      },
    ]);
  }, [bindings, sync]);

  const add = useCallback(async () => {
    if (shell?.pickStorageBinding) {
      const picked = await shell.pickStorageBinding();
      if (!picked) return;
      const hasDefault = bindings.some((b) => b.isDefaultDownload);
      sync([
        ...bindings,
        {
          _key: nextKeyRef.current++,
          sourceId: picked.sourceId,
          rootPath: picked.path,
          isDefaultDownload: !hasDefault,
        },
      ]);
    } else {
      addEmpty();
    }
  }, [shell, bindings, sync, addEmpty]);

  const remove = (index: number) =>
    sync(bindings.filter((_, i) => i !== index));

  const update = (index: number, patch: Partial<VideoBinding>) => {
    const next = [...bindings];
    const prev = next[index];
    next[index] = { ...prev, ...patch };
    // Reset path only when the source itself changes — `StorageBindingForm`
    // always spreads the full value into onChange, so `"sourceId" in patch`
    // alone is not a reliable "source switched" signal.
    if ("sourceId" in patch && patch.sourceId !== prev.sourceId) {
      next[index].rootPath = "";
    }
    sync(next);
  };

  const setDefaultDownload = (index: number) => {
    sync(bindings.map((b, i) => ({ ...b, isDefaultDownload: i === index })));
  };

  const isFixed = minBindings > 0 && minBindings === maxBindings;
  const canAdd =
    typeof maxBindings === "number" ? bindings.length < maxBindings : true;
  const canRemove = bindings.length > minBindings;

  return (
    <div className="space-y-6">
      <Form.Item name="bindings" hidden>
        <Input />
      </Form.Item>

      <div className="rounded-2xl border border-border-base bg-surface-base/50 dark:bg-white/[0.02] p-5">
        {!isFixed && (
          <div className="flex items-start gap-3 mb-4">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">
              <HardDrive className="w-[18px] h-[18px]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-fg-primary">
                {t("storageBindings.fileSource", "文件来源")}
              </h4>
              <p className="text-xs text-fg-muted mt-0.5">
                {t(
                  "storageBindings.fileSourceDesc",
                  "连接本地磁盘、NAS 或远程存储路径，系统将自动扫描并导入其中的媒体文件",
                )}
              </p>
            </div>
          </div>
        )}

        {bindings.length > 0 && (
          <div className={cn("space-y-3", !isFixed && "mb-4")}>
            {bindings.map((binding, index) => (
              <BindingCard
                key={binding._key}
                binding={binding}
                index={index}
                sources={sources}
                onUpdate={update}
                onRemove={remove}
                onSetDefault={setDefaultDownload}
                hideDefaultToggle={isFixed}
                hideRemove={isFixed || !canRemove}
                browse={browse}
              />
            ))}
          </div>
        )}

        {bindings.length === 0 ? (
          <button
            type="button"
            onClick={add}
            className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-border-base hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50/50 dark:hover:bg-green-950/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-fill-tertiary group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
              <FolderOpen className="w-5 h-5 text-fg-muted group-hover:text-green-500 transition-colors" />
            </div>
            <span className="text-sm text-fg-muted group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
              {t("storageBindings.addFileSource", "添加文件来源")}
            </span>
          </button>
        ) : canAdd && !isFixed ? (
          <Button
            variant="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={add}
          >
            {t("storageBindings.addFileSource", "添加文件来源")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export { StorageBindingsField };
