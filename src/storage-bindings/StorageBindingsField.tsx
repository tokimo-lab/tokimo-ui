import { Trash2 } from "lucide-react";
import { Button } from "../Button";
import { Card } from "../Card";
import { Input } from "../Input";
import { Select } from "../Select";

export interface StorageBinding {
  sourceId: string;
  rootPath: string;
  isDefaultDownload?: boolean;
}

export interface VfsSource {
  id: string;
  name: string;
  type: string;
}

export interface StorageBindingsFieldProps {
  value: StorageBinding[];
  onChange: (value: StorageBinding[]) => void;
  sources: VfsSource[];
  mode?: "single" | "multi";
  hideDefaultToggle?: boolean;
}

export function StorageBindingsField({
  value,
  onChange,
  sources,
  mode = "multi",
  hideDefaultToggle = false,
}: StorageBindingsFieldProps) {
  const handleAdd = () => {
    const newBinding: StorageBinding = {
      sourceId: sources[0]?.id || "",
      rootPath: "/",
      isDefaultDownload: false,
    };
    onChange([...value, newBinding]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, updates: Partial<StorageBinding>) => {
    onChange(
      value.map((binding, i) =>
        i === index ? { ...binding, ...updates } : binding,
      ),
    );
  };

  const handleSetDefault = (index: number) => {
    onChange(
      value.map((binding, i) => ({
        ...binding,
        isDefaultDownload: i === index,
      })),
    );
  };

  const sourceOptions = sources.map((source) => ({
    label: source.name,
    value: source.id,
  }));

  return (
    <div className="space-y-3">
      {value.map((binding, index) => {
        // Create a stable key from binding properties
        const bindingKey = `${binding.sourceId}-${binding.rootPath.replace(/\//g, "-")}-${index}`;
        return (
          <Card key={bindingKey} size="small" className="p-4">
            <div className="space-y-3">
              {/* VFS Source Select */}
              <div>
                <label
                  htmlFor={`source-select-${index}`}
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  存储源
                </label>
                <Select
                  value={binding.sourceId}
                  onChange={(newSourceId) =>
                    handleUpdate(index, { sourceId: newSourceId as string })
                  }
                  options={sourceOptions}
                  placeholder="选择存储源"
                  className="w-full"
                />
              </div>

              {/* Root Path Input */}
              <div>
                <label
                  htmlFor={`root-path-${index}`}
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  根路径
                </label>
                <Input
                  id={`root-path-${index}`}
                  value={binding.rootPath}
                  onChange={(e) =>
                    handleUpdate(index, { rootPath: e.target.value })
                  }
                  placeholder="/path/to/directory"
                  className="w-full"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                {/* Default toggle - only in multi mode */}
                {mode === "multi" && !hideDefaultToggle && (
                  <Button
                    size="small"
                    variant={binding.isDefaultDownload ? "primary" : "default"}
                    onClick={() => handleSetDefault(index)}
                  >
                    {binding.isDefaultDownload ? "默认下载路径" : "设为默认"}
                  </Button>
                )}

                {/* Spacer for single mode */}
                {(mode === "single" || hideDefaultToggle) && <div />}

                {/* Remove button - only in multi mode or if more than 1 binding */}
                {(mode === "multi" || value.length > 1) && (
                  <Button
                    size="small"
                    variant="text"
                    danger
                    icon={<Trash2 />}
                    onClick={() => handleRemove(index)}
                    className="cursor-pointer"
                  >
                    移除
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      {/* Add button - only in multi mode */}
      {mode === "multi" && (
        <Button
          variant="dashed"
          block
          onClick={handleAdd}
          disabled={sources.length === 0}
          className="cursor-pointer"
        >
          + 添加路径
        </Button>
      )}

      {/* Empty state - only in multi mode when no bindings */}
      {mode === "multi" && value.length === 0 && (
        <div className="text-center py-6 text-[var(--text-tertiary)] text-sm">
          暂无存储绑定，点击"添加路径"开始配置
        </div>
      )}
    </div>
  );
}
