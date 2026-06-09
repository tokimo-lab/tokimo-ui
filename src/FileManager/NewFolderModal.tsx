import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../Button";
import { Modal } from "../Modal";

interface NewFolderModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  loading?: boolean;
  titleKey?: string;
  defaultName?: string;
}

export function NewFolderModal({
  open,
  onClose,
  onConfirm,
  loading,
  titleKey,
  defaultName,
}: NewFolderModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName(defaultName ?? t("fileManager.defaultFolderName"));
  }, [open, t, defaultName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onConfirm(trimmed);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t(titleKey ?? "fileManager.newFolder")}
      footer={null}
      width={400}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm border border-black/[0.12] dark:border-white/[0.12] bg-surface-raised outline-none focus:border-blue-500"
          onFocus={(e) => e.target.select()}
          // biome-ignore lint/a11y/noAutofocus: modal input needs focus
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button size="small" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            size="small"
            variant="primary"
            htmlType="submit"
            disabled={!name.trim() || loading}
            loading={loading}
          >
            {t("common.confirm")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
