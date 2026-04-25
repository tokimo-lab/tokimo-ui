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
  memo,
  type ReactNode,
  useCallback,
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
  /**
   * Single primary-selected item key. Renders the animated sliding accent
   * indicator + bold text. Use this for the canonical "current page".
   */
  activeKey?: string;
  /**
   * Additional active item keys (multi-selection). Each matching item
   * renders the same static left accent bar + bold text that
   * `item.active = true` produces. The sliding indicator from `activeKey`
   * is preserved alongside; if `activeKey` is unset and `activeKeys` has
   * exactly one entry, that entry gets the sliding indicator instead.
   *
   * Use for "show two related selections at once" cases (e.g. mail account
   * + folder both highlighted).
   */
  activeKeys?: string[];
  /** Called when an item is clicked */
  onSelect?: (key: string) => void;
  /**
   * Footer content rendered inside the standard footer wrapper.
   *
   * Can be a static node, or a render-function that receives the current
   * sidebar visual state. Using the function form lets consumers swap
   * footer layout when the collapsed sidebar expands into hover-preview
   * (e.g. icon-only column → icon+label row).
   */
  footer?:
    | ReactNode
    | ((ctx: { collapsed: boolean; previewExpanded: boolean }) => ReactNode);
  /**
   * Footer action buttons. When provided, the footer area renders the
   * actions in one of three layouts depending on sidebar state:
   *   - rail (collapsed, no hover): vertical 36×36 icon stack + collapse
   *   - hover-preview (collapsed + hover-expanded): full-width icon+label
   *     rows that match the items list look during the preview
   *   - expanded (truly open): horizontal icon-only toolbar with the
   *     collapse toggle pushed to the right edge
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
 * Fixed width (px) of the hover-preview flyout. Hard-coded so the preview
 * pane is consistent across apps, regardless of each consumer's preferred
 * `width` for the fully-expanded inline sidebar.
 */
export const FLOATING_SIDEBAR_PREVIEW_WIDTH = 240;

/**
 * How long (ms) the pointer must stay still over a collapsed floating sidebar
 * before the hover preview expands. Mousemove resets the timer, so sliding
 * through never triggers it — only deliberate dwell does.
 */
export const FLOATING_HOVER_DELAY_MS = 500;

export function AppSidebar(props: AppSidebarProps) {
  const { width = 188, collapsed, className, style } = props;

  const [floatingHover, setFloatingHover] = useState(false);

  // ── Hover-preview: dwell-delay before expanding ──
  // Hover doesn't immediately open the preview pane. Only after the pointer
  // stays (≈ stationary) over the rail for FLOATING_HOVER_DELAY_MS does it
  // expand. Any mousemove resets the timer, so "just sliding through" never
  // triggers the preview. Leaving the rail cancels it.
  const floatingDwellTimerRef = useRef<number | null>(null);
  const clearFloatingDwell = useCallback(() => {
    if (floatingDwellTimerRef.current != null) {
      window.clearTimeout(floatingDwellTimerRef.current);
      floatingDwellTimerRef.current = null;
    }
  }, []);

  // Suppress hover-preview right after a manual collapse: when the user
  // clicks the toggle to retract, their pointer is still hovering the rail —
  // we don't want the preview to auto-open 500 ms later as if they had been
  // dwelling intentionally. Re-arm only after the pointer leaves the rail.
  const suppressHoverUntilLeaveRef = useRef(false);
  // Belt-and-suspenders: even if the suppress ref somehow gets reset
  // (e.g., a stray mouseleave during the layout shift), refuse to schedule
  // the dwell timer for COLLAPSE_GRACE_MS after the most recent transition
  // into collapsed=true. Real intentional dwell still works after the grace.
  const lastCollapsedAtRef = useRef(0);
  const COLLAPSE_GRACE_MS = 800;
  // Suppress hover-preview while the user is actively scrolling inside the
  // rail. Wheel-driven scroll causes the layout under the cursor to shift,
  // which fires mousemove/mouseover even though the user hasn't moved the
  // pointer — exactly like an intentional dwell. Set a small grace window
  // after each wheel event so the dwell timer stays disarmed.
  const lastWheelAtRef = useRef(0);
  const WHEEL_GRACE_MS = 350;
  // Detect prop transitions during render (synchronous, no useEffect race
  // window). Ref mutations during render are allowed by React and idempotent
  // under StrictMode's double-render. This runs BEFORE commit, so any
  // mousemove fired by the upcoming layout shift will already see the
  // suppress flag set.
  const prevCollapsedPropRef = useRef(collapsed);
  if (prevCollapsedPropRef.current !== collapsed) {
    if (collapsed) {
      suppressHoverUntilLeaveRef.current = true;
      lastCollapsedAtRef.current = Date.now();
      if (floatingDwellTimerRef.current != null) {
        window.clearTimeout(floatingDwellTimerRef.current);
        floatingDwellTimerRef.current = null;
      }
      // CRITICAL: if the hover-preview was already expanded when the user
      // clicked to collapse, leaving floatingHover=true makes the sidebar
      // *stay* visually expanded — looks like the click did nothing. Reset
      // synchronously here. setState during render is allowed for this
      // derived-from-prop pattern (and is idempotent under StrictMode).
      setFloatingHover(false);
    }
    prevCollapsedPropRef.current = collapsed;
  }

  const scheduleFloatingDwell = useCallback(() => {
    if (suppressHoverUntilLeaveRef.current) return;
    if (Date.now() - lastCollapsedAtRef.current < COLLAPSE_GRACE_MS) return;
    if (Date.now() - lastWheelAtRef.current < WHEEL_GRACE_MS) return;
    clearFloatingDwell();
    floatingDwellTimerRef.current = window.setTimeout(() => {
      floatingDwellTimerRef.current = null;
      // Re-check at fire time: the suppress flag may have been set after
      // this timer was scheduled (e.g., user clicked toggle while a dwell
      // timer was already running because they were hovering the rail).
      if (suppressHoverUntilLeaveRef.current) return;
      if (Date.now() - lastCollapsedAtRef.current < COLLAPSE_GRACE_MS) return;
      if (Date.now() - lastWheelAtRef.current < WHEEL_GRACE_MS) return;
      setFloatingHover(true);
    }, FLOATING_HOVER_DELAY_MS);
  }, [clearFloatingDwell]);
  useEffect(() => clearFloatingDwell, [clearFloatingDwell]);

  // Wrap the consumer's onToggleCollapsed so that *clicking to collapse*
  // synchronously sets the suppress flag and cancels any in-flight dwell
  // timer in the same JS turn. Doing this in a useEffect would race with
  // the mousemove events fired immediately after the click (when the layout
  // shifts under a stationary pointer), which would re-schedule the dwell.
  //
  // IMPORTANT: only override when the consumer actually provided a callback.
  // Some consumers (e.g. ChatSidebar) embed their own toggle button inside
  // `footer` and intentionally omit `onToggleCollapsed` so InlineSidebar
  // does NOT render an additional default toggle. Passing a wrapped function
  // unconditionally would force the default toggle to appear, producing a
  // duplicate.
  const userOnToggleCollapsed = props.onToggleCollapsed;
  const wrappedOnToggleCollapsed = useCallback(() => {
    if (!collapsed) {
      suppressHoverUntilLeaveRef.current = true;
      clearFloatingDwell();
      setFloatingHover(false);
    }
    userOnToggleCollapsed?.();
  }, [collapsed, userOnToggleCollapsed, clearFloatingDwell]);
  const effectiveOnToggleCollapsed = userOnToggleCollapsed
    ? wrappedOnToggleCollapsed
    : undefined;

  const hoverExpand = !!collapsed && floatingHover;
  const visuallyExpanded = !collapsed || hoverExpand;
  const effectiveWidth = hoverExpand
    ? FLOATING_SIDEBAR_PREVIEW_WIDTH
    : visuallyExpanded
      ? width
      : FLOATING_SIDEBAR_COLLAPSED_WIDTH;
  // Placeholder occupies the rail's "permanent" width (does NOT widen on
  // hover-expand — that overlay should sit over the content area, not push it).
  const placeholderWidth = collapsed ? FLOATING_SIDEBAR_COLLAPSED_WIDTH : width;

  const handleEnter = !floatingHover ? scheduleFloatingDwell : undefined;
  const handleLeave = useCallback(() => {
    clearFloatingDwell();
    setFloatingHover(false);
    // User actually left the rail — re-enable auto hover-preview for the
    // next time they come back.
    suppressHoverUntilLeaveRef.current = false;
  }, [clearFloatingDwell]);
  // Mousemove resets the dwell timer: any motion means "still deciding, not
  // committed". Only bind while the preview is closed — once expanded the CSS
  // width transition causes spurious mousemove events under the pointer which
  // would immediately re-arm the timer (harmless but wasteful).
  const handleMove =
    !!collapsed && !floatingHover ? scheduleFloatingDwell : undefined;

  const handleToggleHoverEnter = useCallback(() => {
    clearFloatingDwell();
    setFloatingHover(false);
  }, [clearFloatingDwell]);

  // Wheel handling — two requirements from real-user testing:
  //   (a) Mid-scroll: never trigger hover-expand. Wheel-driven layout shifts
  //       fire a mousemove storm under the stationary cursor, which would
  //       otherwise re-arm the dwell timer.
  //   (b) Already hover-expanded: do NOT retract. The user is intentionally
  //       interacting with the open rail (e.g. scrolling a long folder list
  //       inside the preview). Retracting would feel hostile.
  //   (c) Post-scroll: 500 ms after the last wheel event, the rail should
  //       hover-expand on its own — assuming the cursor is still inside.
  //       The user expects "I scrolled, then waited briefly, sidebar opens".
  //
  // Implementation: handleWheel cancels any pending dwell timer and sets a
  // single-shot "post-wheel" timer for WHEEL_REARM_MS. Each new wheel
  // resets that timer, so the timer fires exactly once after the wheel
  // events stop. handleLeave already cancels this timer ref, so leaving
  // the rail mid-scroll cleans up correctly.
  const WHEEL_REARM_MS = 500;
  const handleWheel = useCallback(() => {
    lastWheelAtRef.current = Date.now();
    if (floatingDwellTimerRef.current != null) {
      window.clearTimeout(floatingDwellTimerRef.current);
      floatingDwellTimerRef.current = null;
    }
    floatingDwellTimerRef.current = window.setTimeout(() => {
      floatingDwellTimerRef.current = null;
      // Re-check at fire time. Don't expand if user manually collapsed
      // mid-scroll, or if the cursor is no longer inside.
      if (suppressHoverUntilLeaveRef.current) return;
      if (Date.now() - lastCollapsedAtRef.current < COLLAPSE_GRACE_MS) return;
      setFloatingHover(true);
    }, WHEEL_REARM_MS);
  }, []);

  // Inner collapsed mirrors the prop directly. Previously a 200 ms deferred
  // swap kept the inner layout in "expanded" mode while the wrapper width
  // animated from `width` → 48, which produced a clipped/distorted "preview"
  // visual during the transition (the source of the perceived lag and the
  // "why is the expanded view flashing on collapse?" UX bug). With instant
  // swap: rail layout snaps to the left edge immediately, the wrapper width
  // animates from `width` → 48 around it (right edge shrinks in cleanly),
  // and only one render happens per toggle.
  const innerCollapsed = collapsed ?? false;

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
          // Hover-preview reuses the host window's titlebar background
          // (semi-transparent rgba) so the flyout matches the chrome that
          // sits above it. Add backdrop blur so text below doesn't bleed
          // through the translucent layer.
          hoverExpand
            ? "bg-[var(--titlebar-bg,var(--sidebar-bg))] backdrop-blur-2xl"
            : "bg-[var(--sidebar-bg)]",
          "transition-[width] duration-200 ease-out",
          className,
        )}
        style={{
          width: effectiveWidth,
          willChange: "width",
          contain: "layout paint",
          ...style,
        }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onMouseMove={handleMove}
        // CRITICAL: capture phase, not bubble. ScrollArea inside InlineSidebar
        // attaches a native non-passive wheel listener that calls
        // stopPropagation() to keep the page from scrolling — so a normal
        // onWheel on this wrapper would never fire. Capture-phase delegation
        // runs BEFORE the inner bubble listener, so we still see the event.
        onWheelCapture={handleWheel}
      >
        <InlineSidebar
          {...props}
          onToggleCollapsed={effectiveOnToggleCollapsed}
          collapsed={innerCollapsed}
          _transparentBg
          _floatingHoverExpanded={hoverExpand}
          _onToggleHoverEnter={handleToggleHoverEnter}
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
 *
 * Wrapped in `memo` so toggling hover-preview state on the outer wrapper
 * (which only changes the wrapper's width / z-index / background) doesn't
 * re-render the entire item tree of every consumer (Photo / Video / Music /
 * Docs sidebars can hold dozens to hundreds of items). Callbacks from the
 * outer `AppSidebar` are memoized via `useCallback` to keep this effective.
 */
const InlineSidebar = memo(InlineSidebarInner);

function InlineSidebarInner(props: AppSidebarProps) {
  const {
    width = 188,
    header,
    headerIcon,
    headerTitle,
    sections,
    activeKey,
    activeKeys,
    onSelect,
    footer: footerProp,
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

  // Resolve the indicator anchor: explicit activeKey wins; otherwise if
  // exactly one entry exists in activeKeys, that one gets the sliding bar.
  const singleActiveKey =
    activeKey ?? (activeKeys && activeKeys.length === 1 ? activeKeys[0] : null);

  // Combined set of keys that should show static accent bars (everything
  // in activeKeys, plus activeKey when activeKeys also has entries — so
  // both visually mark as "active"). When only activeKey is set and
  // activeKeys is empty, no static bars render — only the sliding one.
  const staticActiveKeys = new Set<string>();
  if (activeKeys && activeKeys.length > 0) {
    for (const k of activeKeys) staticActiveKeys.add(k);
    // If activeKey is also set, it joins the static-bar set so multi-select
    // visually includes the primary too.
    if (activeKey != null) staticActiveKeys.add(activeKey);
    // When length === 1 and activeKey unset, that single key uses the
    // sliding indicator instead of a static bar.
    if (activeKey == null && activeKeys.length === 1) {
      staticActiveKeys.delete(activeKeys[0]);
    }
  }

  const isActiveKey = (key: string): boolean =>
    key === activeKey || (activeKeys?.includes(key) ?? false);
  const isStaticActive = (key: string): boolean => staticActiveKeys.has(key);

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
    if (!singleActiveKey || !itemsRef.current) {
      setIndicator(null);
      return;
    }
    const container = itemsRef.current;
    let activeEl: HTMLElement | null = null;
    for (const el of container.querySelectorAll("[data-sidebar-key]")) {
      if (el.getAttribute("data-sidebar-key") === singleActiveKey) {
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
  }, [singleActiveKey, sectionFingerprint, collapsed]);

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

  const footer =
    typeof footerProp === "function"
      ? footerProp({
          collapsed: !!collapsed,
          previewExpanded: !!_floatingHoverExpanded,
        })
      : footerProp;

  const effectiveFooter = (() => {
    const hasActions = !!footerActions && footerActions.length > 0;
    if (hasActions && footer) {
      // dev-time hint via console; silent in prod
      console.warn(
        "[AppSidebar] `footer` and `footerActions` are mutually exclusive — `footerActions` takes precedence.",
      );
    }
    if (hasActions) {
      // 3 layouts:
      //   - "rail"      → collapsed, not hover-expanded: 36×36 vertical icon stack
      //   - "labelRow"  → collapsed + hover-expanded: full-width icon+label rows
      //                   (matches the items list look during hover preview)
      //   - "row"       → fully expanded: horizontal icon-only toolbar + collapse on right
      const layout: "rail" | "labelRow" | "row" = !collapsed
        ? "row"
        : _floatingHoverExpanded
          ? "labelRow"
          : "rail";

      const toggleIcon =
        layout === "rail" ? (
          <PanelLeftOpen size={16} />
        ) : (
          <PanelLeftClose size={16} />
        );
      const toggleTooltipPlacement = layout === "row" ? "top" : "right";

      const compactToggle =
        onToggleCollapsed && !_hideToggle ? (
          layout === "labelRow" ? (
            <button
              type="button"
              data-sidebar-toggle
              onClick={onToggleCollapsed}
              onMouseEnter={
                _onToggleHoverEnter ? _onToggleHoverEnter : undefined
              }
              className="flex h-9 w-full shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2 text-fg-muted transition-colors hover:bg-black/[0.06] hover:text-fg-base dark:hover:bg-white/[0.06]"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                {toggleIcon}
              </span>
              <span className="min-w-0 flex-1 truncate text-left text-sm">
                {collapseLabel}
              </span>
            </button>
          ) : (
            <Tooltip
              title={collapsed ? expandLabel : collapseLabel}
              placement={toggleTooltipPlacement}
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
                {toggleIcon}
              </button>
            </Tooltip>
          )
        ) : null;

      return (
        <div
          className={cn(
            "flex gap-1",
            layout === "row" ? "items-center" : "flex-col items-stretch",
          )}
        >
          {footerActions.map((action) =>
            layout === "labelRow" ? (
              <button
                key={action.key}
                type="button"
                onClick={action.onClick}
                aria-label={action.label}
                className={cn(
                  "flex h-9 w-full shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2 transition-colors",
                  action.variant === "primary"
                    ? "bg-[var(--accent)] text-white hover:opacity-90"
                    : "text-fg-muted hover:bg-black/[0.06] hover:text-fg-base dark:hover:bg-white/[0.06]",
                )}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {action.icon}
                </span>
                <span className="min-w-0 flex-1 truncate text-left text-sm">
                  {action.label}
                </span>
              </button>
            ) : (
              <Tooltip
                key={action.key}
                title={action.label}
                placement={layout === "row" ? "top" : "right"}
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
            ),
          )}
          {compactToggle && (
            <>
              {layout === "row" && <div className="flex-1" />}
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
      ? FLOATING_SIDEBAR_PREVIEW_WIDTH
      : FLOATING_SIDEBAR_COLLAPSED_WIDTH;
    return (
      <div
        className={cn(
          "relative flex shrink-0 flex-col overflow-hidden border-r border-border-base select-none",
          "transition-[width] duration-200 ease-out",
          _transparentBg ? "bg-transparent" : "bg-[var(--sidebar-bg)]",
          className,
        )}
        style={{ width: railWidth, ...style }}
      >
        {headerIcon && (
          <div
            className={cn(
              "flex h-[48px] shrink-0 items-center border-b border-black/[0.06] dark:border-white/[0.08]",
              "justify-start px-0",
            )}
          >
            <div className="flex w-12 shrink-0 items-center justify-center">
              {headerIcon}
            </div>
            {_floatingHoverExpanded && headerTitle && (
              <div className="min-w-0 flex-1 truncate pr-3 pl-1 text-sm font-medium text-fg-primary">
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
            thumbSize={_floatingHoverExpanded ? "normal" : "thin"}
            className="flex-1 pt-2"
            style={topInset ? { paddingTop: topInset } : undefined}
          >
            {/* biome-ignore lint/a11y/noStaticElementInteractions: hover registers items area for indicator tracking */}
            <div
              ref={itemsRef}
              onMouseEnter={_onItemsHoverEnter}
              className="relative flex w-full flex-col items-stretch gap-0.5"
            >
              {/* Sliding accent indicator — lives inside the scroll content so
                  it scrolls with the items. Stays at left edge in both rail
                  and preview modes since icons don't move. */}
              {indicator && (
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
                    className="flex w-full flex-col items-stretch"
                  >
                    {hasPrevNonEmpty && (
                      <div className="my-1 mx-3 border-t border-black/[0.08] dark:border-white/[0.08]" />
                    )}
                    {section.items.map((item) => {
                      const matchedActive = isActiveKey(item.key);
                      const explicitActive = item.active === true;
                      const isActive = explicitActive || matchedActive;
                      // Static accent bar (same visual as item.active=true)
                      // is shown for items in `activeKeys` that aren't the
                      // sole sliding-indicator anchor — so secondary
                      // selections stay visible alongside the primary one.
                      const renderStaticAccent =
                        explicitActive || isStaticActive(item.key);
                      // Rail icon button is at least 36 px so the hit-target
                      // remains comfortable; tall variants grow beyond that.
                      // Used in both rail and preview modes so heights stay
                      // identical (only width animates).
                      const railSize = Math.max(36, metrics.itemHeight);
                      const rowButton = (
                        // biome-ignore lint/correctness/useJsxKeyInIterable: button is wrapped in keyed `row`/`Tooltip` element below
                        <button
                          type="button"
                          onClick={() => onSelect?.(item.key)}
                          onContextMenu={item.onContextMenu}
                          style={{ height: railSize }}
                          className={cn(
                            "group flex w-full cursor-pointer items-center justify-start rounded-lg transition-colors",
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
                          {/* Fixed-width icon column matching the rail width
                              so icons stay at the SAME x-position whether the
                              wrapper is collapsed (48 wide) or hover-expanded
                              (full width). Width animates only — icon does not
                              shift. */}
                          <span
                            className="flex shrink-0 items-center justify-center"
                            style={{ width: FLOATING_SIDEBAR_COLLAPSED_WIDTH }}
                          >
                            {item.collapsedIcon ?? item.icon}
                          </span>
                          {_floatingHoverExpanded && (
                            <span
                              className={cn(
                                "min-w-0 flex-1 truncate pr-3 text-left text-sm",
                                isActive ? "font-medium" : "",
                              )}
                            >
                              {item.label}
                            </span>
                          )}
                        </button>
                      );
                      const row = (
                        <div
                          key={item.key}
                          data-sidebar-key={item.key}
                          className="relative flex w-full items-center"
                        >
                          {renderStaticAccent && (
                            <span className="pointer-events-none absolute top-1/2 left-0 z-20 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--accent)]" />
                          )}
                          {rowButton}
                          {item.extra && (
                            <span
                              className={cn(
                                "pointer-events-none",
                                _floatingHoverExpanded
                                  ? "absolute top-1/2 right-3 -translate-y-1/2"
                                  : "absolute top-1 right-1",
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
          <div className="shrink-0 border-t border-black/[0.06] py-1 px-1 dark:border-white/[0.08]">
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
                      isActive={isActiveKey(item.key)}
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
  const useDefaultMetrics =
    metrics.iconSize === 16 && metrics.itemHeight === 32;

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
