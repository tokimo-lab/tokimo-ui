/**
 * AppSidebar — shared left-sidebar navigation component.
 *
 * Active indicator slides between items with animation.
 * Supports section labels (小字隔开), two-line items with subtitle,
 * header/footer slots, and trailing extra content.
 */

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ScrollArea } from "./ScrollArea/ScrollArea";
import { Tooltip } from "./Tooltip";
import { cn } from "./utils";

export interface AppSidebarItem {
  key: string;
  icon?: ReactNode;
  /** Icon shown in collapsed (icon-only) mode — falls back to icon if not provided */
  collapsedIcon?: ReactNode;
  label: string;
  /** Second-line text displayed below the label */
  subtitle?: string;
  /** Trailing content (e.g., edit button) rendered at the right side */
  extra?: ReactNode;
  /** Tooltip text shown on hover */
  tooltip?: string;
  /** Rich content rendered below the main label row (e.g., charts, badges) */
  content?: ReactNode;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export interface AppSidebarSection {
  key?: string;
  /** Small uppercase header text separating groups */
  label?: string;
  items: AppSidebarItem[];
}

export interface AppSidebarProps {
  /** Width in pixels (default: 188) */
  width?: number;
  /** Header content rendered inside the standard header wrapper (expanded mode) */
  header?: ReactNode;
  /**
   * Icon rendered in the collapsed-mode header block so the item list
   * start-Y aligns with expanded mode. Usually the same icon element used
   * inside `header`. If omitted, no header block is drawn in collapsed mode.
   */
  headerIcon?: ReactNode;
  /**
   * Title text rendered next to `headerIcon` when a floating hoverable sidebar
   * is expanded on hover. Kept separate from `header` so the icon can stay
   * anchored in the 48px rail column (preventing a shift between rail and
   * hover-expanded states).
   */
  headerTitle?: ReactNode;
  /** Navigation sections */
  sections: AppSidebarSection[];
  /** Currently active item key */
  activeKey?: string;
  /** Called when an item is clicked */
  onSelect?: (key: string) => void;
  /** Footer content rendered inside the standard footer wrapper */
  footer?: ReactNode;
  /** Extra top padding (px) added above the nav items — use for macOS traffic-light inset */
  topInset?: number;
  /** Show a centered spinner instead of items */
  loading?: boolean;
  /** When true, renders a 48 px icon-only sidebar with tooltips */
  collapsed?: boolean;
  /**
   * Collapse behavior:
   * - "static" (default): rail stays collapsed, no hover interaction
   * - "hoverable": on hover over the collapsed rail, floats a full-width flyout
   *   over the right-side content (absolute-positioned, does NOT push layout)
   */
  collapseMode?: "static" | "hoverable";
  /**
   * If provided, a bottom toggle button is rendered in the footer area.
   * The callback receives no arguments; the consumer is expected to flip
   * the `collapsed` prop externally.
   */
  onToggleCollapsed?: () => void;
  /** Tooltip/label text for the toggle button (expanded mode) */
  collapseLabel?: string;
  /** Tooltip text for the toggle button (collapsed mode) */
  expandLabel?: string;
  className?: string;
  /** CSS custom properties or other inline styles on the container */
  style?: React.CSSProperties;
  /**
   * @internal — used by hover-flyout mode to render the inner expanded sidebar
   * without its own bg, so the flyout's frosted-glass container provides it.
   */
  _transparentBg?: boolean;
  /**
   * @internal — used by hover-flyout mode to suppress the footer toggle button
   * inside the flyout (the toggle stays on the underlying 48px rail).
   */
  _hideToggle?: boolean;
  /**
   * @internal — when true, the toggle button renders icon-only (no text label)
   * even in expanded mode. Used by the flyout footer so the toggle style
   * matches the underlying collapsed rail.
   */
  _iconOnlyToggle?: boolean;
  /**
   * @internal — used by floating mode to render the collapsed rail with
   * labels revealed next to each icon during hover-expand. Items keep their
   * collapsed-state selection style (3px accent bar + centered icon) while
   * labels fade in on the right.
   */
  _floatingHoverExpanded?: boolean;
  /**
   * @internal — floating mode: called when the toggle button is hovered
   * so the wrapper can retract the hover preview (making the toggle icon
   * reflect the permanent collapsed state).
   */
  _onToggleHoverEnter?: () => void;
  /**
   * @internal — floating mode: called when the pointer enters the items
   * region (between header and footer). Used to re-open the hover preview
   * after it was retracted by a toggle hover, once the user moves back
   * into the items area.
   */
  _onItemsHoverEnter?: () => void;
  /**
   * Layout mode:
   * - "inline" (default): sidebar occupies layout space as a flex/grid child.
   * - "floating": sidebar is absolutely positioned (`inset-y-0 left-0`), does
   *   not occupy layout space. Parent must be `position: relative` and apply
   *   its own `margin-left` to content. Width smoothly transitions between
   *   48px (collapsed) and `width` (expanded). When combined with
   *   `collapseMode="hoverable"` + `collapsed`, hovering the rail expands
   *   the sidebar over content without pushing layout.
   */
  layoutMode?: "inline" | "floating";
}

/** Width of the floating sidebar when visually collapsed (icon rail). */
export const FLOATING_SIDEBAR_COLLAPSED_WIDTH = 48;

export function AppSidebar(props: AppSidebarProps) {
  const {
    width = 188,
    header,
    headerIcon,
    headerTitle,
    sections,
    activeKey,
    onSelect,
    footer,
    loading,
    topInset,
    collapsed,
    collapseMode = "static",
    onToggleCollapsed,
    collapseLabel = "Collapse",
    expandLabel = "Expand",
    className,
    style,
    _transparentBg,
    _hideToggle,
    _iconOnlyToggle,
    _floatingHoverExpanded,
    _onToggleHoverEnter,
    _onItemsHoverEnter,
    layoutMode = "inline",
  } = props;
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [floatingHover, setFloatingHover] = useState(false);
  const [floatingInnerCollapsed, setFloatingInnerCollapsed] = useState(
    collapsed ?? false,
  );
  const itemsRef = useRef<HTMLDivElement>(null);
  const canAnimate = useRef(false);
  const [indicator, setIndicator] = useState<{
    top: number;
    height: number;
  } | null>(null);

  // Stable fingerprint of section item keys — recalculate indicator when items change (e.g. search filter)
  const sectionFingerprint = sections
    .map((s) => s.items.map((i) => i.key).join(","))
    .join("|");

  // biome-ignore lint/correctness/useExhaustiveDependencies: sectionFingerprint triggers recalculation when items change (e.g. search filter)
  useLayoutEffect(() => {
    if (!activeKey || !itemsRef.current) {
      setIndicator(null);
      return;
    }
    const container = itemsRef.current;
    let activeEl: HTMLElement | null = null;
    for (const el of container.querySelectorAll("[data-sidebar-key]")) {
      if (el.getAttribute("data-sidebar-key") === activeKey) {
        activeEl = el as HTMLElement;
        break;
      }
    }
    if (!activeEl) {
      setIndicator(null);
      return;
    }
    const top = activeEl.offsetTop;
    const height = activeEl.offsetHeight;
    setIndicator((prev) => {
      if (prev && prev.top === top && prev.height === height) return prev;
      return { top, height };
    });
  }, [activeKey, sectionFingerprint, collapsed]);

  // Enable slide animation after initial positioning
  useEffect(() => {
    canAnimate.current = true;
  }, []);

  // Reset animation on mode change to avoid cross-mode sliding
  const prevCollapsed = useRef(collapsed);
  useLayoutEffect(() => {
    if (prevCollapsed.current !== collapsed) {
      canAnimate.current = false;
      prevCollapsed.current = collapsed;
      requestAnimationFrame(() => {
        canAnimate.current = true;
      });
    }
  }, [collapsed]);

  // ── Floating mode: sync inner collapsed state with width transition ──
  // On manual toggle (collapsed prop changes), we swap the inner layout
  // between standard-expanded and rail. To avoid the inner content snapping
  // during the 200ms wrapper width transition, delay the retract swap.
  // Hover-expand does NOT swap layouts — it keeps the rail and just reveals
  // labels via `_floatingHoverExpanded`, so no delay is needed there.
  const floatingManuallyExpanded = !collapsed;
  useEffect(() => {
    if (layoutMode !== "floating") return;
    const target = !floatingManuallyExpanded;
    if (target === floatingInnerCollapsed) return;
    if (target) {
      const t = setTimeout(() => setFloatingInnerCollapsed(true), 200);
      return () => clearTimeout(t);
    }
    setFloatingInnerCollapsed(false);
  }, [layoutMode, floatingManuallyExpanded, floatingInnerCollapsed]);

  // ── Floating mode: absolute-positioned sidebar with width transition ──
  if (layoutMode === "floating") {
    const hoverExpand =
      !!collapsed && collapseMode === "hoverable" && floatingHover;
    const visuallyExpanded = !collapsed || hoverExpand;
    const effectiveWidth = visuallyExpanded
      ? width
      : FLOATING_SIDEBAR_COLLAPSED_WIDTH;
    const handleEnter =
      collapseMode === "hoverable"
        ? () => setFloatingHover(true)
        : undefined;
    const handleLeave =
      collapseMode === "hoverable"
        ? () => setFloatingHover(false)
        : undefined;
    // When hover-expanded, moving the pointer onto the toggle button causes
    // setFloatingHover(false). Re-opening the preview when the user moves
    // back to the items/header region is handled by binding onMouseEnter
    // to those specific zones (see `_onItemsHoverEnter` below). We avoid
    // onMouseMove on the wrapper because CSS width transitions cause the
    // element under the pointer to oscillate, producing jitter.
    return (
      <div
        className={cn(
          "absolute inset-y-0 left-0 z-10 flex flex-col overflow-hidden select-none",
          "border-r border-border-base",
          // Frosted-glass overlay when hover-expanded (uses shared glass token,
          // same as Card/Modal/Drawer); solid sidebar background otherwise.
          hoverExpand
            ? "bg-surface-glass backdrop-blur-glass shadow-2xl"
            : "bg-[var(--sidebar-bg)]",
          "transition-[width] duration-200 ease-out",
          className,
        )}
        style={{ width: effectiveWidth, ...style }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <AppSidebar
          {...props}
          layoutMode="inline"
          collapsed={floatingInnerCollapsed}
          collapseMode="static"
          _transparentBg
          _floatingHoverExpanded={hoverExpand}
          _onToggleHoverEnter={
            collapseMode === "hoverable"
              ? () => setFloatingHover(false)
              : undefined
          }
          _onItemsHoverEnter={
            collapseMode === "hoverable"
              ? () => setFloatingHover(true)
              : undefined
          }
          className="h-full border-0 border-r-0"
        />
      </div>
    );
  }

  // ── Hover-flyout mode: render collapsed rail + full-cover flyout overlay ──
  //
  // Tencent Cloud pattern:
  //   - Rail (collapsed, 48px) has an "expand" button (PanelLeftOpen) at the bottom.
  //   - Hovering over the ITEMS area opens the flyout (fully covers the rail).
  //   - Hovering over the TOGGLE area does NOT open the flyout — this lets the
  //     user click the expand button directly without the flyout flashing in/out.
  //   - The flyout has its own icon-only dismiss button at the same bottom
  //     position which, when hovered, retracts the flyout to reveal the rail.
  if (collapseMode === "hoverable" && collapsed) {
    const flyoutDismissBtn = (
      <button
        type="button"
        onMouseEnter={() => setFlyoutOpen(false)}
        onClick={() => setFlyoutOpen(false)}
        title={expandLabel}
        className={cn(
          "flex h-9 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-fg-muted transition-colors",
          "hover:bg-black/[0.06] hover:text-fg-base dark:hover:bg-white/[0.06]",
        )}
      >
        <PanelLeftClose size={16} />
      </button>
    );

    const flyoutInjectedFooter = (
      <>
        {footer}
        {flyoutDismissBtn}
      </>
    );

    // Render rail toggle OUTSIDE the items-hover zone so it doesn't open flyout.
    const railToggleExternal = onToggleCollapsed ? (
      <div className="shrink-0 border-t border-r border-t-black/[0.06] border-r-border-base bg-[var(--sidebar-bg)] px-2 py-2 dark:border-t-white/[0.08]">
        <button
          type="button"
          onClick={onToggleCollapsed}
          title={expandLabel}
          className={cn(
            "flex h-9 w-full cursor-pointer items-center justify-center rounded-lg text-fg-muted transition-colors",
            "hover:bg-black/[0.06] hover:text-fg-base dark:hover:bg-white/[0.06]",
          )}
        >
          <PanelLeftOpen size={16} />
        </button>
      </div>
    ) : null;

    return (
      <div
        className="relative flex h-full shrink-0 flex-col"
        style={{ width: 48 }}
        onMouseLeave={() => setFlyoutOpen(false)}
      >
        {/* Items zone — ONLY this area opens the flyout */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: non-interactive wrapper used only for hover open */}
        <div
          className="relative min-h-0 flex-1"
          onMouseEnter={() => setFlyoutOpen(true)}
        >
          <AppSidebar
            {...props}
            collapseMode="static"
            _hideToggle
            className="h-full"
          />
        </div>
        {/* Toggle zone — does NOT open flyout; user can click it directly */}
        {railToggleExternal}
        {/* Flyout — full-cover overlay (items + toggle area); always rendered
            so CSS transition can animate enter/exit */}
        <div
          className={cn(
            "absolute inset-0 z-40 overflow-hidden border-r border-border-base shadow-2xl",
            "bg-white/85 dark:bg-black/70 backdrop-blur-2xl",
            "transition-[opacity,transform] duration-200 ease-out",
            flyoutOpen
              ? "translate-x-0 opacity-100"
              : "pointer-events-none -translate-x-3 opacity-0",
          )}
          style={{ width }}
          aria-hidden={!flyoutOpen}
        >
          <AppSidebar
            {...props}
            collapsed={false}
            collapseMode="static"
            _transparentBg
            _hideToggle
            footer={flyoutInjectedFooter}
            className="h-full"
          />
        </div>
      </div>
    );
  }

  // Compose footer with toggle button when onToggleCollapsed is provided
  const showToggleIconOnly = collapsed || _iconOnlyToggle;
  // In hover-expanded mode, pretend we're "open" visually: show the close-icon,
  // but keep the icon in the 48px left column so its position is identical to
  // the rail's toggle button (prevents the icon from jumping when hover retracts).
  const toggleButton =
    onToggleCollapsed && !_hideToggle ? (
      <button
        type="button"
        data-sidebar-toggle
        onClick={onToggleCollapsed}
        onMouseEnter={
          _floatingHoverExpanded && _onToggleHoverEnter
            ? _onToggleHoverEnter
            : undefined
        }
        title={collapsed ? expandLabel : collapseLabel}
        className={cn(
          "flex cursor-pointer items-center rounded-lg text-fg-muted transition-colors hover:bg-black/[0.06] hover:text-fg-base dark:hover:bg-white/[0.06]",
          _floatingHoverExpanded
            ? "h-9 w-full justify-start"
            : showToggleIconOnly
              ? "h-9 w-full justify-center"
              : "h-8 w-full justify-start gap-2 px-2.5 text-xs",
        )}
      >
        {_floatingHoverExpanded ? (
          // Hover-preview mode: the retract handler fires on pointer-enter,
          // so the user only sees this icon for a frame before the preview
          // collapses. Using PanelLeftClose here matches the would-be
          // "expanded" visual continuity during that frame.
          <span className="flex w-8 shrink-0 items-center justify-center">
            <PanelLeftClose size={16} />
          </span>
        ) : collapsed ? (
          <PanelLeftOpen size={16} />
        ) : showToggleIconOnly ? (
          <PanelLeftClose size={16} />
        ) : (
          <>
            <PanelLeftClose size={14} />
            <span>{collapseLabel}</span>
          </>
        )}
      </button>
    ) : null;

  const effectiveFooter =
    footer || toggleButton ? (
      <div className="flex flex-col gap-1">
        {footer}
        {toggleButton}
      </div>
    ) : null;

  // ── Collapsed (icon-only) mode ────────────────────────────────────
  if (collapsed) {
    const railWidth = _floatingHoverExpanded
      ? width
      : FLOATING_SIDEBAR_COLLAPSED_WIDTH;
    const headerHeight = headerIcon ? 48 : 0;
    const scrollAreaPaddingTop = topInset ?? 8;
    return (
      <div
        className={cn(
          "relative flex shrink-0 flex-col overflow-hidden border-r border-border-base select-none",
          _transparentBg ? "bg-transparent" : "bg-[var(--sidebar-bg)]",
          className,
        )}
        style={{ width: railWidth, ...style }}
      >
        {/* Sliding accent indicator — rendered at sidebar root to hug left edge */}
        {indicator && (
          <span
            className="pointer-events-none absolute left-0 z-20 w-[3px] rounded-r-full bg-[var(--accent)]"
            style={{
              top:
                headerHeight +
                scrollAreaPaddingTop +
                indicator.top +
                (indicator.height - 28) / 2,
              height: 28,
              transition: canAnimate.current
                ? "top 200ms ease-out"
                : "none",
            }}
          />
        )}
        {headerIcon && (
          <div
            className={cn(
              "flex h-[48px] shrink-0 items-center border-b border-black/[0.06] dark:border-white/[0.08]",
              _floatingHoverExpanded ? "px-2" : "justify-center px-2",
            )}
          >
            <div
              className={cn(
                "flex shrink-0 items-center justify-center",
                _floatingHoverExpanded ? "w-8" : "w-12",
              )}
            >
              {headerIcon}
            </div>
            {_floatingHoverExpanded && headerTitle && (
              <div className="min-w-0 flex-1 truncate pr-3 pl-1.5 text-sm font-medium text-fg-primary">
                {headerTitle}
              </div>
            )}
          </div>
        )}
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-40" />
          </div>
        ) : (
          <ScrollArea
            direction="vertical"
            className={cn(
              "flex-1 pt-2",
              _floatingHoverExpanded ? "px-2" : "px-1",
            )}
            style={topInset ? { paddingTop: topInset } : undefined}
          >
            <div
              ref={itemsRef}
              onMouseEnter={_onItemsHoverEnter}
              className={cn(
                "relative flex w-full flex-col gap-0.5",
                _floatingHoverExpanded ? "items-stretch" : "items-center",
              )}
            >
              {sections.map((section, si) => {
                if (section.items.length === 0) return null;
                const hasPrevNonEmpty = sections
                  .slice(0, si)
                  .some((s) => s.items.length > 0);
                return (
                  <div
                    key={section.key ?? `s-${si}`}
                    className={cn(
                      "flex w-full flex-col",
                      _floatingHoverExpanded
                        ? "items-stretch"
                        : "items-center",
                    )}
                  >
                    {hasPrevNonEmpty && (
                      <div
                        className={cn(
                          "my-1 border-t border-black/[0.08] dark:border-white/[0.08]",
                          _floatingHoverExpanded ? "mx-3" : "w-6",
                        )}
                      />
                    )}
                    {section.items.map((item) => {
                      const isActive = activeKey === item.key;
                      const rowButton = (
                        <button
                          type="button"
                          onClick={() => onSelect?.(item.key)}
                          onContextMenu={item.onContextMenu}
                          className={cn(
                            "group flex cursor-pointer items-center rounded-lg transition-colors",
                            _floatingHoverExpanded
                              ? "h-9 w-full"
                              : "h-9 w-9 justify-center",
                            isActive
                              ? _floatingHoverExpanded
                                ? "text-fg-primary"
                                : ""
                              : cn(
                                  "text-fg-muted hover:bg-black/[0.08] hover:text-fg-base dark:hover:bg-white/[0.08]",
                                  "[&_[data-app-icon]]:opacity-60 hover:[&_[data-app-icon]]:opacity-100",
                                ),
                          )}
                        >
                          {_floatingHoverExpanded ? (
                            <>
                              <span className="flex w-8 shrink-0 items-center justify-center">
                                {item.collapsedIcon ?? item.icon}
                              </span>
                              <span
                                className={cn(
                                  "min-w-0 flex-1 truncate pl-1.5 pr-3 text-left text-sm",
                                  isActive ? "font-medium" : "",
                                )}
                              >
                                {item.label}
                              </span>
                            </>
                          ) : (
                            (item.collapsedIcon ?? item.icon)
                          )}
                        </button>
                      );
                      const row = (
                        <div
                          key={item.key}
                          data-sidebar-key={item.key}
                          className={cn(
                            "relative flex items-center",
                            _floatingHoverExpanded ? "w-full" : "",
                          )}
                        >
                          {rowButton}
                          {item.extra && (
                            <span
                              className={cn(
                                "pointer-events-none",
                                _floatingHoverExpanded
                                  ? "absolute top-1 right-3"
                                  : "absolute -top-1 -right-1",
                              )}
                            >
                              {item.extra}
                            </span>
                          )}
                        </div>
                      );
                      return _floatingHoverExpanded ? (
                        row
                      ) : (
                        <Tooltip
                          key={item.key}
                          title={item.tooltip ?? item.label}
                          placement="right"
                        >
                          {row}
                        </Tooltip>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {effectiveFooter && (
          <div
            className={cn(
              "shrink-0 border-t border-black/[0.06] py-1 dark:border-white/[0.08]",
              _floatingHoverExpanded ? "px-2" : "px-1",
            )}
          >
            {effectiveFooter}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col overflow-hidden border-r border-border-base select-none",
        _transparentBg ? "bg-transparent" : "bg-[var(--sidebar-bg)]",
        className,
      )}
      style={{ width, ...style }}
    >
      {header && (
        <div className="flex shrink-0 items-center gap-2 border-b border-black/[0.06] px-5 pt-4 pb-3 dark:border-white/[0.08]">
          {header}
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-40" />
        </div>
      ) : (
        <ScrollArea
          direction="vertical"
          className="flex-1 px-2 pt-3"
          style={topInset ? { paddingTop: topInset } : undefined}
        >
          <div ref={itemsRef} className="relative isolate">
            {/* Sliding active indicator */}
            {indicator && (
              <div
                className="pointer-events-none absolute inset-x-0 z-[-1] rounded-lg bg-black/[0.06] dark:bg-white/[0.06]"
                style={{
                  top: indicator.top,
                  height: indicator.height,
                  transition: canAnimate.current
                    ? "top 200ms ease-out, height 200ms ease-out"
                    : "none",
                }}
              />
            )}
            {sections.map((section, si) => (
              <div key={section.key ?? `s-${si}`}>
                {section.label && (
                  <div
                    className={cn(
                      "mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-fg-muted",
                      si > 0 && "mt-3",
                    )}
                  >
                    {section.label}
                  </div>
                )}
                {section.items.map((item) => (
                  <SidebarItemButton
                    key={item.key}
                    item={item}
                    isActive={activeKey === item.key}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {effectiveFooter && (
        <div className="shrink-0 border-t border-black/[0.06] px-2 py-2 dark:border-white/[0.08]">
          {effectiveFooter}
        </div>
      )}
    </div>
  );
}

function SidebarItemButton({
  item,
  isActive,
  onSelect,
}: {
  item: AppSidebarItem;
  isActive: boolean;
  onSelect?: (key: string) => void;
}) {
  const hasContent = !!item.content;

  const itemClasses = cn(
    "mb-0.5 flex w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
    hasContent ? "flex-col" : "items-center gap-2.5",
    isActive
      ? "text-fg-primary font-medium"
      : "text-fg-muted hover:bg-black/[0.06] dark:hover:bg-white/[0.06] [&_[data-app-icon]]:opacity-60 hover:[&_[data-app-icon]]:opacity-100",
    item.extra != null && "group/sidebar-item",
  );

  const mainRow = (
    <>
      {item.icon && <span className="shrink-0">{item.icon}</span>}
      {item.subtitle ? (
        <div className="min-w-0 flex-1">
          <span className="block truncate leading-tight">{item.label}</span>
          <span className="mt-0.5 block truncate text-[10px] text-fg-muted">
            {item.subtitle}
          </span>
        </div>
      ) : (
        <span className="min-w-0 flex-1 truncate leading-tight">
          {item.label}
        </span>
      )}
      {item.extra && <div className="shrink-0">{item.extra}</div>}
    </>
  );

  const fullContent = hasContent ? (
    <>
      <div className="flex w-full items-center gap-2.5">{mainRow}</div>
      <div className="mt-1.5 w-full">{item.content}</div>
    </>
  ) : (
    mainRow
  );

  if (item.extra) {
    const el = (
      // biome-ignore lint/a11y/useSemanticElements: div wrapper needed for nested interactive content in extra
      <div
        data-sidebar-key={item.key}
        role="button"
        tabIndex={0}
        onClick={() => onSelect?.(item.key)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.(item.key);
          }
        }}
        onContextMenu={item.onContextMenu}
        className={itemClasses}
      >
        {fullContent}
      </div>
    );
    return item.tooltip ? (
      <Tooltip title={item.tooltip} placement="right">
        {el}
      </Tooltip>
    ) : (
      el
    );
  }

  const btn = (
    <button
      data-sidebar-key={item.key}
      type="button"
      onClick={() => onSelect?.(item.key)}
      onContextMenu={item.onContextMenu}
      className={itemClasses}
    >
      {fullContent}
    </button>
  );
  return item.tooltip ? (
    <Tooltip title={item.tooltip} placement="right">
      {btn}
    </Tooltip>
  ) : (
    btn
  );
}
