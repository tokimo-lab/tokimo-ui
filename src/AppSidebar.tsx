/**
 * AppSidebar — shared left-sidebar navigation component.
 *
 * Self-contained floating sidebar with built-in placeholder.
 *
 * Renders TWO sibling elements wrapped in a fragment:
 *   1. A placeholder `<div>` that participates in the document flow and
 *      smoothly transitions its width between collapsed (48 px) and
 *      expanded (`width`, default 188 px). This is what gives the rest of
 *      the page its "the sidebar takes N px" layout.
 *   2. An absolutely-positioned `<aside>` (`absolute inset-y-0 left-0`)
 *      containing the actual rail / hover-flyout UI. This element is what
 *      visibly grows on hover-expand without pushing the page content.
 *
 * Caller responsibility:
 *   - The parent that hosts `<AppSidebar />` MUST be `position: relative`,
 *     otherwise the floating aside will escape to the nearest positioned
 *     ancestor.
 *   - Use a flex/grid parent and let content fill the remaining space; do
 *     **not** compute `marginLeft` / `gridTemplateColumns` from `collapsed`
 *     anymore — the placeholder handles that automatically.
 *
 * Recommended layout:
 *   ```tsx
 *   <div className="relative flex h-full">
 *     <AppSidebar collapsed={...} onToggleCollapsed={...} sections={...} />
 *     <div className="flex-1 min-w-0">{content}</div>
 *   </div>
 *   ```
 *
 * Behavior is permanently floating + hoverable: when `collapsed`, dwelling
 * over the rail for {@link FLOATING_HOVER_DELAY_MS} ms expands a frosted
 * preview; mousemove resets the timer so sliding through never triggers it.
 *
 * Active indicator slides between items with animation.
 * Supports section labels, two-line items with subtitle, header/footer
 * slots, and trailing extra content.
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
  /**
   * Force this item into the active visual state, independent of `activeKey`.
   * Useful when a section represents an "always-on" current selection that runs
   * in parallel with another section's primary navigation (e.g. the current
   * mail account showing alongside the current folder). Items marked this way
   * render a static left accent bar instead of the global sliding indicator.
   */
  active?: boolean;
}

export interface AppSidebarSection {
  key?: string;
  /** Small uppercase header text separating groups */
  label?: string;
  items: AppSidebarItem[];
  /**
   * Preset visual size. `default` = 16 px icon + 32 px row (existing look),
   * `tall` = 28 px icon + 44 px row (suitable for avatar/account rows).
   * Per-section overrides via `iconSize` / `itemHeight` take precedence.
   */
  variant?: "default" | "tall";
  /** Override icon-slot size in px. Wins over variant default. */
  iconSize?: number;
  /** Override per-item row height in px. Wins over variant default. */
  itemHeight?: number;
}

export interface AppSidebarFooterAction {
  key: string;
  icon: ReactNode;
  /** Used as tooltip + a11y label. */
  label: string;
  onClick: () => void;
  /** `primary` gets accent fill; `default` is subtle hover. */
  variant?: "default" | "primary";
}

const SECTION_VARIANT_METRICS: Record<
  NonNullable<AppSidebarSection["variant"]>,
  { iconSize: number; itemHeight: number }
> = {
  default: { iconSize: 16, itemHeight: 32 },
  tall: { iconSize: 28, itemHeight: 44 },
};

function resolveSectionMetrics(section: AppSidebarSection): {
  iconSize: number;
  itemHeight: number;
} {
  const preset = SECTION_VARIANT_METRICS[section.variant ?? "default"];
  return {
    iconSize: section.iconSize ?? preset.iconSize,
    itemHeight: section.itemHeight ?? preset.itemHeight,
  };
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
   * Title text rendered next to `headerIcon` while the rail is hover-expanded.
   * Kept separate from `header` so the icon can stay anchored in the 48 px
   * rail column (preventing a shift between rail and hover-expanded states).
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
  /**
   * Footer action buttons. When provided, the footer area renders the
   * actions row (collapsed: vertical stack of 36 px icon buttons; expanded:
   * horizontal row aligned left) followed by the collapse toggle (right
   * side in expanded mode, bottom in collapsed mode).
   *
   * Mutually exclusive with `footer` — supplying both will use
   * `footerActions` and emit a dev warning.
   */
  footerActions?: AppSidebarFooterAction[];
  /** Extra top padding (px) added above the nav items — use for macOS traffic-light inset */
  topInset?: number;
  /** Show a centered spinner instead of items */
  loading?: boolean;
  /** When true, renders a 48 px icon-only sidebar with tooltips */
  collapsed?: boolean;
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
  /** ClassName applied to the absolute floating aside */
  className?: string;
  /** Inline style applied to the absolute floating aside */
  style?: React.CSSProperties;
  /**
   * @internal — used by the hover-preview wrapper to render the inner
   * sidebar without its own bg, so the wrapper's frosted-glass / solid
   * surface provides it.
   */
  _transparentBg?: boolean;
  /**
   * @internal — used by the hover-preview wrapper to suppress the footer
   * toggle button inside the inner render (the toggle stays on the
   * underlying 48 px rail position).
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
   * collapsed-state selection style (3 px accent bar + centered icon) while
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
}

/** Width of the floating sidebar when visually collapsed (icon rail). */
export const FLOATING_SIDEBAR_COLLAPSED_WIDTH = 48;

/**
 * How long (ms) the pointer must stay still over a collapsed floating sidebar
 * before the hover preview expands. Mousemove resets the timer, so sliding
 * through never triggers it — only deliberate dwell does.
 */
export const FLOATING_HOVER_DELAY_MS = 500;

export function AppSidebar(props: AppSidebarProps) {
  const { width = 188, collapsed, className, style } = props;

  const [floatingHover, setFloatingHover] = useState(false);
  const [floatingInnerCollapsed, setFloatingInnerCollapsed] = useState(
    collapsed ?? false,
  );

  // ── Hover-preview: dwell-delay before expanding ──
  // Hover doesn't immediately open the preview pane. Only after the pointer
  // stays (≈ stationary) over the rail for FLOATING_HOVER_DELAY_MS does it
  // expand. Any mousemove resets the timer, so "just sliding through" never
  // triggers the preview. Leaving the rail cancels it.
  const floatingDwellTimerRef = useRef<number | null>(null);
  const clearFloatingDwell = () => {
    if (floatingDwellTimerRef.current != null) {
      window.clearTimeout(floatingDwellTimerRef.current);
      floatingDwellTimerRef.current = null;
    }
  };
  const scheduleFloatingDwell = () => {
    clearFloatingDwell();
    floatingDwellTimerRef.current = window.setTimeout(() => {
      floatingDwellTimerRef.current = null;
      setFloatingHover(true);
    }, FLOATING_HOVER_DELAY_MS);
  };
  useEffect(() => clearFloatingDwell, []);

  // ── Sync inner collapsed state with width transition ──
  // On manual toggle (collapsed prop changes), we swap the inner layout
  // between standard-expanded and rail. To avoid the inner content snapping
  // during the 200 ms wrapper width transition, delay the retract swap.
  // Hover-expand does NOT swap layouts — it keeps the rail and just reveals
  // labels via `_floatingHoverExpanded`, so no delay is needed there.
  const floatingManuallyExpanded = !collapsed;
  useEffect(() => {
    const target = !floatingManuallyExpanded;
    if (target === floatingInnerCollapsed) return;
    if (target) {
      const t = setTimeout(() => setFloatingInnerCollapsed(true), 200);
      return () => clearTimeout(t);
    }
    setFloatingInnerCollapsed(false);
  }, [floatingManuallyExpanded, floatingInnerCollapsed]);

  const hoverExpand = !!collapsed && floatingHover;
  const visuallyExpanded = !collapsed || hoverExpand;
  const effectiveWidth = visuallyExpanded
    ? width
    : FLOATING_SIDEBAR_COLLAPSED_WIDTH;
  // Placeholder occupies the rail's "permanent" width (does NOT widen on
  // hover-expand — that overlay should sit over the content area, not push it).
  const placeholderWidth = collapsed ? FLOATING_SIDEBAR_COLLAPSED_WIDTH : width;

  const handleEnter = !floatingHover ? scheduleFloatingDwell : undefined;
  const handleLeave = () => {
    clearFloatingDwell();
    setFloatingHover(false);
  };
  // Mousemove resets the dwell timer: any motion means "still deciding, not
  // committed". Only bind while the preview is closed — once expanded the CSS
  // width transition causes spurious mousemove events under the pointer which
  // would immediately re-arm the timer (harmless but wasteful).
  const handleMove =
    !!collapsed && !floatingHover ? scheduleFloatingDwell : undefined;

  return (
    <>
      {/* Placeholder — participates in document flow, sizes the layout. */}
      <div
        aria-hidden
        className="shrink-0 transition-[width] duration-200 ease-out"
        style={{ width: placeholderWidth }}
      />
      {/* Floating aside — absolutely positioned over the parent (which MUST
          be position: relative). Smoothly grows on hover-expand without
          pushing the placeholder or page content. */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: hover wrapper for dwell-delay preview */}
      <div
        className={cn(
          // Base z-10; bumps to z-30 while hover-expanded so the preview
          // overlays nested floating sidebars (e.g. SecondaryMasterDetailLayout).
          "absolute inset-y-0 left-0 flex flex-col overflow-hidden select-none",
          hoverExpand ? "z-30" : "z-10",
          "border-r border-border-base",
          // Frosted-glass overlay when hover-expanded (mirrors Modal/Drawer
          // hand-written glass palette since project has no shared GlassPanel
          // primitive yet); solid sidebar background otherwise.
          hoverExpand
            ? "bg-white/85 dark:bg-black/70 backdrop-blur-2xl shadow-2xl"
            : "bg-[var(--sidebar-bg)]",
          "transition-[width] duration-200 ease-out",
          className,
        )}
        style={{ width: effectiveWidth, ...style }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onMouseMove={handleMove}
      >
        <InlineSidebar
          {...props}
          collapsed={floatingInnerCollapsed}
          _transparentBg
          _floatingHoverExpanded={hoverExpand}
          _onToggleHoverEnter={() => {
            clearFloatingDwell();
            setFloatingHover(false);
          }}
          _onItemsHoverEnter={scheduleFloatingDwell}
          className="h-full border-0 border-r-0"
        />
      </div>
    </>
  );
}

/**
 * Inline (non-floating) sidebar render. Always laid out in normal flow,
 * fills its container via `h-full`. Used as the inner element of the
 * floating wrapper.
 */
function InlineSidebar(props: AppSidebarProps) {
  const {
    width = 188,
    header,
    headerIcon,
    headerTitle,
    sections,
    activeKey,
    onSelect,
    footer,
    footerActions,
    loading,
    topInset,
    collapsed,
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
  } = props;

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

  // Compose footer with toggle button when onToggleCollapsed is provided
  const showToggleIconOnly = collapsed || _iconOnlyToggle;
  // In hover-expanded mode, pretend we're "open" visually: show the close-icon,
  // but keep the icon in the 48 px left column so its position is identical to
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

  const effectiveFooter = (() => {
    const hasActions = !!footerActions && footerActions.length > 0;
    if (hasActions && footer) {
      // dev-time hint via console; silent in prod
      console.warn(
        "[AppSidebar] `footer` and `footerActions` are mutually exclusive — `footerActions` takes precedence.",
      );
    }
    if (hasActions) {
      // In rail (collapsed, not hover) → vertical stack. Otherwise → horizontal row.
      const isRow = _floatingHoverExpanded || !collapsed;
      const compactToggle =
        onToggleCollapsed && !_hideToggle ? (
          <Tooltip
            title={collapsed ? expandLabel : collapseLabel}
            placement={isRow ? "top" : "right"}
          >
            <button
              type="button"
              data-sidebar-toggle
              onClick={onToggleCollapsed}
              onMouseEnter={
                _floatingHoverExpanded && _onToggleHoverEnter
                  ? _onToggleHoverEnter
                  : undefined
              }
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-black/[0.06] hover:text-fg-base dark:hover:bg-white/[0.06]"
            >
              {_floatingHoverExpanded || !collapsed ? (
                <PanelLeftClose size={16} />
              ) : (
                <PanelLeftOpen size={16} />
              )}
            </button>
          </Tooltip>
        ) : null;
      return (
        <div
          className={cn(
            "flex gap-1",
            isRow ? "items-center" : "flex-col items-stretch",
          )}
        >
          {footerActions.map((action) => (
            <Tooltip
              key={action.key}
              title={action.label}
              placement={isRow ? "top" : "right"}
            >
              <button
                type="button"
                onClick={action.onClick}
                aria-label={action.label}
                className={cn(
                  "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors",
                  action.variant === "primary"
                    ? "bg-[var(--accent)] text-white hover:opacity-90"
                    : "text-fg-muted hover:bg-black/[0.06] hover:text-fg-base dark:hover:bg-white/[0.06]",
                )}
              >
                {action.icon}
              </button>
            </Tooltip>
          ))}
          {compactToggle && (
            <>
              {isRow && <div className="flex-1" />}
              {compactToggle}
            </>
          )}
        </div>
      );
    }
    return footer || toggleButton ? (
      <div className="flex flex-col gap-1">
        {footer}
        {toggleButton}
      </div>
    ) : null;
  })();

  // ── Collapsed (icon-only) mode ────────────────────────────────────
  if (collapsed) {
    const railWidth = _floatingHoverExpanded
      ? width
      : FLOATING_SIDEBAR_COLLAPSED_WIDTH;
    return (
      <div
        className={cn(
          "relative flex shrink-0 flex-col overflow-hidden border-r border-border-base select-none",
          _transparentBg ? "bg-transparent" : "bg-[var(--sidebar-bg)]",
          className,
        )}
        style={{ width: railWidth, ...style }}
      >
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
            className={cn("flex-1 pt-2", _floatingHoverExpanded && "px-2")}
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
              {/* Sliding accent indicator — lives inside the scroll content so
                  it scrolls with the items. Negative left offset (-px-1 of the
                  ScrollArea) pulls it back to the rail's left edge. */}
              {indicator && !_floatingHoverExpanded && (
                <span
                  className="pointer-events-none absolute left-0 z-20 w-[3px] rounded-r-full bg-[var(--accent)]"
                  style={{
                    top: indicator.top + (indicator.height - 28) / 2,
                    height: 28,
                    transition: canAnimate.current
                      ? "top 200ms ease-out"
                      : "none",
                  }}
                />
              )}
              {sections.map((section, si) => {
                if (section.items.length === 0) return null;
                const hasPrevNonEmpty = sections
                  .slice(0, si)
                  .some((s) => s.items.length > 0);
                const metrics = resolveSectionMetrics(section);
                return (
                  <div
                    key={section.key ?? `s-${si}`}
                    className={cn(
                      "flex w-full flex-col",
                      _floatingHoverExpanded ? "items-stretch" : "items-center",
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
                      // `item.active` (explicit) wins over the global `activeKey` match.
                      // Explicitly-active items render a static accent bar instead of
                      // contributing to the sliding indicator (only one section's
                      // selection animates at a time).
                      const explicitActive = item.active === true;
                      const isActive = explicitActive || activeKey === item.key;
                      // Rail icon button is at least 36 px so the hit-target
                      // remains comfortable; tall variants grow beyond that.
                      const railSize = Math.max(36, metrics.itemHeight);
                      const rowButton = (
                        <button
                          type="button"
                          onClick={() => onSelect?.(item.key)}
                          onContextMenu={item.onContextMenu}
                          style={
                            _floatingHoverExpanded
                              ? { height: metrics.itemHeight }
                              : { height: railSize, width: railSize }
                          }
                          className={cn(
                            "group flex cursor-pointer items-center rounded-lg transition-colors",
                            _floatingHoverExpanded
                              ? "w-full"
                              : "justify-center",
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
                              <span
                                className="flex shrink-0 items-center justify-center"
                                style={{ width: Math.max(32, metrics.iconSize + 4) }}
                              >
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
                          {/* Static accent bar for `item.active` items. The
                              global sliding indicator only follows `activeKey`,
                              so explicitly-active items (parallel selection
                              like the current mail account) get their own bar. */}
                          {explicitActive && (
                            <span
                              className={cn(
                                "pointer-events-none absolute z-20 w-[3px] rounded-r-full bg-[var(--accent)]",
                                _floatingHoverExpanded
                                  ? "top-1/2 left-0 h-[60%] -translate-y-1/2"
                                  : "top-1/2 -left-0.5 h-7 -translate-y-1/2",
                              )}
                            />
                          )}
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
            {sections.map((section, si) => {
              const metrics = resolveSectionMetrics(section);
              return (
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
                      metrics={metrics}
                    />
                  ))}
                </div>
              );
            })}
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
  metrics,
}: {
  item: AppSidebarItem;
  isActive: boolean;
  onSelect?: (key: string) => void;
  metrics: { iconSize: number; itemHeight: number };
}) {
  const hasContent = !!item.content;

  // Default variant keeps original look (px-3 py-2.5 ≈ 36 px row).
  // Larger metrics override via inline style for height + icon container.
  const useDefaultMetrics = metrics.iconSize === 16 && metrics.itemHeight === 32;

  const itemClasses = cn(
    "mb-0.5 flex w-full cursor-pointer rounded-lg text-left text-sm transition-colors",
    useDefaultMetrics ? "px-3 py-2.5" : "px-2.5",
    hasContent ? "flex-col" : "items-center gap-2.5",
    isActive
      ? "text-fg-primary font-medium"
      : "text-fg-muted hover:bg-black/[0.06] dark:hover:bg-white/[0.06] [&_[data-app-icon]]:opacity-60 hover:[&_[data-app-icon]]:opacity-100",
    item.extra != null && "group/sidebar-item",
  );
  const itemStyle = useDefaultMetrics
    ? undefined
    : ({ minHeight: metrics.itemHeight } as React.CSSProperties);

  const iconWrapStyle = useDefaultMetrics
    ? undefined
    : ({
        width: metrics.iconSize,
        height: metrics.iconSize,
      } as React.CSSProperties);

  const mainRow = (
    <>
      {item.icon && (
        <span
          className="flex shrink-0 items-center justify-center"
          style={iconWrapStyle}
        >
          {item.icon}
        </span>
      )}
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
        style={itemStyle}
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
      style={itemStyle}
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
