import { FloatingFocusManager, useFloating } from "@floating-ui/react";
import { ChevronDown, Menu, X } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import type { AppSidebarProps } from "./AppSidebar";
import { AppSidebarList } from "./AppSidebarList";
import { Drawer } from "./Drawer";
import { cn } from "./utils";

export function MobileAppSidebar(props: AppSidebarProps) {
  const { mobile, sections, activeKey, activeKeys, onSelect, loading } = props;
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const dialogId = useId();
  const scrollTop = useRef(0);
  const close = useCallback(() => setOpen(false), []);
  const { refs, context } = useFloating({ open, onOpenChange: setOpen });
  const activeItem = sections
    .flatMap((section) => section.items)
    .find((item) => item.key === activeKey);

  if (!mobile) return null;

  return (
    <>
      <div className="flex h-14 shrink-0 items-center border-b border-base bg-surface-sidebar px-3">
        <button
          ref={refs.setReference}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          onClick={() => setOpen(true)}
          className="flex h-11 min-w-0 cursor-pointer items-center gap-3 rounded-xl px-3 text-fg-primary outline-none hover:bg-surface-overlay-hover focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Menu size={20} className="shrink-0 text-fg-secondary" />
          <span className="truncate text-sm font-semibold">
            {activeItem?.label ?? mobile.title}
          </span>
          <ChevronDown size={16} className="shrink-0 text-fg-muted" />
        </button>
      </div>
      <Drawer
        open={open}
        onClose={close}
        placement="bottom"
        height="min(85%, 560px)"
        closable={false}
        className="overflow-hidden rounded-t-2xl"
        bodyStyle={{ padding: 0, overflow: "hidden" }}
      >
        <FloatingFocusManager context={context} disabled={!open} returnFocus>
          <div
            ref={refs.setFloating}
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="flex h-full min-h-0 flex-col bg-surface-overlay text-fg-primary"
          >
            <div className="flex min-h-16 shrink-0 items-center gap-3 border-b border-base px-5">
              <h2
                id={titleId}
                className="min-w-0 flex-1 text-base font-semibold"
              >
                {mobile.title}
              </h2>
              <button
                type="button"
                aria-label={mobile.closeLabel}
                onClick={close}
                className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-fg-secondary outline-none hover:bg-surface-overlay-hover focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X size={20} />
              </button>
            </div>
            <div
              ref={(element) => {
                if (element) element.scrollTop = scrollTop.current;
              }}
              onScroll={(event) => {
                scrollTop.current = event.currentTarget.scrollTop;
              }}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            >
              <AppSidebarList
                sections={sections}
                activeKey={activeKey}
                activeKeys={activeKeys}
                loading={loading}
                onSelect={(key) => {
                  onSelect?.(key);
                  close();
                }}
              />
            </div>
            {mobile.footerActions && mobile.footerActions.length > 0 && (
              <div className="shrink-0 space-y-1 border-t border-base p-3">
                {mobile.footerActions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => {
                      close();
                      action.onClick();
                    }}
                    className={cn(
                      "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      action.variant === "primary"
                        ? "bg-accent text-fg-on-accent hover:bg-accent-hover"
                        : "text-fg-secondary hover:bg-surface-overlay-hover",
                    )}
                  >
                    <span className="flex size-6 items-center justify-center [&>svg]:size-5">
                      {action.icon}
                    </span>
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </FloatingFocusManager>
      </Drawer>
    </>
  );
}
