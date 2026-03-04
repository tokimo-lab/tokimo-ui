import { X } from "lucide-react";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { Button } from "./Button";
import { cn } from "./utils";

/* ─── ScaledModal size presets ─── */
export type ScaledModalSize = "full" | "almost-full" | "large" | "default";

export interface ModalProps {
  /** Whether visible */
  open?: boolean;
  /** Title */
  title?: ReactNode;
  /** OK text */
  okText?: string;
  /** Cancel text */
  cancelText?: string;
  /** OK button props */
  okButtonProps?: {
    danger?: boolean;
    loading?: boolean;
    disabled?: boolean;
  };
  /** Cancel button props */
  cancelButtonProps?: {
    disabled?: boolean;
  };
  /** OK callback */
  onOk?: () => undefined | Promise<unknown>;
  /** Cancel / close callback */
  onCancel?: () => void;
  /** Custom footer — pass null to hide */
  footer?: ReactNode | null;
  /** Width (number or CSS string) */
  width?: number | string;
  /** ScaledModal size mode */
  size?: ScaledModalSize;
  /** Close on mask click */
  maskClosable?: boolean;
  /** Keyboard closable (Esc) */
  keyboard?: boolean;
  /** Close icon visible */
  closable?: boolean;
  /** Destroy on close */
  destroyOnClose?: boolean;
  /** Alias for destroyOnClose (antd compat) */
  destroyOnHidden?: boolean;
  /** Confirm loading */
  confirmLoading?: boolean;
  /** Z-index */
  zIndex?: number;
  /** Body style */
  bodyStyle?: CSSProperties;
  /** Styles API (antd v5 compat) */
  styles?: { body?: CSSProperties; root?: CSSProperties; mask?: CSSProperties };
  /** Container style */
  style?: CSSProperties;
  /** CSS class for wrapper */
  className?: string;
  /** CSS class for body */
  wrapClassName?: string;
  children?: ReactNode;
  /** Centered vertically */
  centered?: boolean;
  /** After open animation callback */
  afterOpenChange?: (open: boolean) => void;
}

const THIN_SCROLLBAR: CSSProperties = {
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(128,128,128,0.4) transparent",
};

interface SizeConfig {
  width: string | number;
  dialogStyle: CSSProperties;
  bodyStyle: CSSProperties;
  containerStyle?: CSSProperties;
}

const SIZE_CONFIG: Record<ScaledModalSize, SizeConfig> = {
  full: {
    width: "100vw",
    dialogStyle: {
      maxWidth: "100vw",
      margin: 0,
      padding: 0,
      borderRadius: 0,
      height: "100vh",
    },
    bodyStyle: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      overflowX: "hidden",
      ...THIN_SCROLLBAR,
    },
    containerStyle: {
      display: "flex",
      flexDirection: "column",
      height: "100%",
    },
  },
  "almost-full": {
    width: "calc(100vw - 48px)",
    dialogStyle: {
      maxWidth: "calc(100vw - 48px)",
      height: "calc(100vh - 48px)",
    },
    bodyStyle: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      overflowX: "hidden",
      ...THIN_SCROLLBAR,
    },
    containerStyle: {
      display: "flex",
      flexDirection: "column",
      height: "100%",
    },
  },
  large: {
    width: "90vw",
    dialogStyle: { maxWidth: 1400 },
    bodyStyle: {
      maxHeight: "calc(100vh - 200px)",
      overflowY: "auto",
      overflowX: "hidden",
      ...THIN_SCROLLBAR,
    },
  },
  default: {
    width: 520,
    dialogStyle: {},
    bodyStyle: {},
  },
};

export function Modal({
  open = false,
  title,
  okText = "确定",
  cancelText = "取消",
  okButtonProps,
  cancelButtonProps,
  onOk,
  onCancel,
  footer,
  width: widthProp,
  size = "default",
  maskClosable = true,
  keyboard = true,
  closable = true,
  destroyOnClose: destroyOnCloseProp,
  destroyOnHidden,
  confirmLoading = false,
  zIndex = 1000,
  bodyStyle,
  styles,
  style,
  className,
  wrapClassName,
  centered = false,
  afterOpenChange,
  children,
}: ModalProps) {
  const destroyOnClose = destroyOnCloseProp ?? destroyOnHidden ?? false;
  const contentRef = useRef<HTMLDivElement>(null);

  // Keyboard handler
  useEffect(() => {
    if (!open || !keyboard) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, keyboard, onCancel]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // afterOpenChange
  useEffect(() => {
    afterOpenChange?.(open);
  }, [open, afterOpenChange]);

  if (!open && destroyOnClose) return null;
  if (!open) return null;

  const config = SIZE_CONFIG[size];
  const resolvedWidth =
    size === "default" ? (widthProp ?? config.width) : config.width;

  const isLoading = confirmLoading || okButtonProps?.loading;

  const defaultFooter = (
    <div className="flex justify-end gap-2 pt-4">
      <Button onClick={onCancel} disabled={cancelButtonProps?.disabled}>
        {cancelText}
      </Button>
      <Button
        variant={okButtonProps?.danger ? "danger" : "primary"}
        loading={isLoading}
        disabled={okButtonProps?.disabled}
        onClick={onOk}
      >
        {okText}
      </Button>
    </div>
  );

  const renderedFooter = footer === null ? null : (footer ?? defaultFooter);

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 flex items-start justify-center",
        centered && "items-center",
        size === "full" && "items-stretch",
        wrapClassName,
      )}
      style={{ zIndex }}
    >
      {/* Mask */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: overlay mask click-to-dismiss */}
      <div
        className="absolute inset-0 bg-black/45 transition-opacity"
        role="presentation"
        onClick={maskClosable ? onCancel : undefined}
      />
      {/* Dialog */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: dialog panel stopPropagation */}
      <div
        ref={contentRef}
        className={cn(
          "relative bg-white dark:bg-slate-900 rounded-lg shadow-2xl flex flex-col",
          size === "full" && "!rounded-none",
          !centered && size !== "full" && "mt-[10vh]",
          className,
        )}
        style={{
          width: resolvedWidth,
          ...config.dialogStyle,
          ...style,
        }}
        role="presentation"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || closable) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
            {title ? (
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 m-0">
                {title}
              </h3>
            ) : (
              <span />
            )}
            {closable ? (
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                onClick={onCancel}
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        )}
        {/* Body */}
        <div
          className="px-6 py-4"
          style={{
            ...config.bodyStyle,
            ...bodyStyle,
            ...styles?.body,
            ...(config.containerStyle ?? {}),
          }}
        >
          {children}
        </div>
        {/* Footer */}
        {renderedFooter ? (
          <div className="px-6 pb-4 shrink-0">{renderedFooter}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/* ─── Modal.confirm utility ─── */
export interface ConfirmConfig {
  title: ReactNode;
  content?: ReactNode;
  okText?: string;
  cancelText?: string;
  onOk?: () => undefined | Promise<unknown>;
  onCancel?: () => void;
  okButtonProps?: ModalProps["okButtonProps"];
  type?: "confirm" | "info" | "success" | "error" | "warning";
  /** Icon for confirm dialog */
  icon?: ReactNode;
  /** OK button type (antd compat) */
  okType?: string;
}

/**
 * Imperative confirm dialog.
 * Creates a temporary React root and renders a Modal.
 */
Modal.confirm = (config: ConfirmConfig) => {
  const container = document.createElement("div");
  document.body.appendChild(container);

  const root = createRoot(container);

  const destroy = () => {
    root.unmount();
    container.remove();
  };

  const ConfirmDialog = () => {
    const [open, setOpen] = useState(true);
    return (
      <Modal
        open={open}
        title={config.title}
        okText={config.okText ?? "确定"}
        cancelText={config.cancelText ?? "取消"}
        okButtonProps={config.okButtonProps}
        onOk={async () => {
          await config.onOk?.();
          setOpen(false);
          setTimeout(destroy, 300);
        }}
        onCancel={() => {
          config.onCancel?.();
          setOpen(false);
          setTimeout(destroy, 300);
        }}
      >
        {config.content}
      </Modal>
    );
  };

  root.render(<ConfirmDialog />);
};
