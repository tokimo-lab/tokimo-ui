import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../utils";
import {
  type ScrollbarConfig,
  ScrollbarTracks,
  useScrollbar,
} from "./use-scrollbar";

// ─── Types ───

export interface ScrollAreaProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children?: ReactNode;
  /** Scroll direction. @default "both" */
  direction?: ScrollbarConfig["direction"];
  /** Auto-hide scrollbar when idle. @default true */
  autoHide?: boolean;
  /** Delay (ms) before hiding scrollbar. @default 800 */
  autoHideDelay?: number;
  /** Minimum thumb length (px). @default 24 */
  thumbMinSize?: number;
  /** Extra className for inner content wrapper */
  innerClassName?: string;
  /** Hide the scrollbar tracks entirely (still scrollable). @default false */
  hideScrollbar?: boolean;
  /** Fires on every scroll position change */
  onScrollChange?: (scrollX: number, scrollY: number) => void;

  // ─── Virtualization (single-axis, uniform item size) ───
  // When `itemCount` + `itemHeight` + `renderItem` are provided, ScrollArea
  // switches to virtualized mode and only renders items inside the viewport
  // (+ overscan). `direction` must be "vertical" or "horizontal" in this mode.
  /** Total number of items (enables virtualization) */
  itemCount?: number;
  /** Item size in the scroll axis (height for vertical, width for horizontal) */
  itemHeight?: number;
  /** Render callback; wrapped in an absolutely-positioned slot */
  renderItem?: (index: number) => ReactNode;
  /** Extra items rendered outside viewport for smooth scrolling. @default 5 */
  overscan?: number;
  /** Fires when the visible item range (incl. overscan) changes */
  onRangeChange?: (start: number, end: number) => void;
}

export interface ScrollAreaRef {
  scrollTo: (x: number, y: number) => void;
  scrollBy: (dx: number, dy: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  /** Only useful in virtualized mode */
  scrollToIndex: (index: number) => void;
  getScrollPosition: () => { x: number; y: number };
  getViewportRect: () => DOMRect | null;
}

// ─── Component ───

export const ScrollArea = forwardRef<ScrollAreaRef, ScrollAreaProps>(
  function ScrollArea(
    {
      children,
      direction = "both",
      autoHide = true,
      autoHideDelay = 800,
      thumbMinSize = 24,
      innerClassName,
      hideScrollbar = false,
      onScrollChange,
      itemCount,
      itemHeight,
      renderItem,
      overscan = 5,
      onRangeChange,
      className,
      ...rest
    },
    ref,
  ) {
    const virtualizing =
      itemCount != null && itemHeight != null && renderItem != null;
    const virtualAxis: "vertical" | "horizontal" =
      direction === "horizontal" ? "horizontal" : "vertical";
    const totalSize = virtualizing ? itemCount * itemHeight : 0;

    const viewportRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const scrollXRef = useRef(0);
    const scrollYRef = useRef(0);
    const targetXRef = useRef(0);
    const targetYRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const dimsRef = useRef({ vw: 0, vh: 0, cw: 0, ch: 0 });
    const [overflow, setOverflow] = useState({ x: false, y: false });
    const onScrollRef = useRef(onScrollChange);
    onScrollRef.current = onScrollChange;
    const hideScrollbarRef = useRef(hideScrollbar);
    hideScrollbarRef.current = hideScrollbar;
    const onRangeRef = useRef(onRangeChange);
    onRangeRef.current = onRangeChange;

    // Virtualization visible range
    const [range, setRange] = useState({ start: 0, end: 0 });

    // Keep virt params in refs for use inside applyScroll
    const virtRef = useRef({
      virtualizing,
      axis: virtualAxis,
      itemHeight: itemHeight ?? 0,
      itemCount: itemCount ?? 0,
      overscan,
    });
    virtRef.current = {
      virtualizing,
      axis: virtualAxis,
      itemHeight: itemHeight ?? 0,
      itemCount: itemCount ?? 0,
      overscan,
    };

    // Stable config refs — avoids recreating useScrollbar callbacks on every render
    const directionRef = useRef(direction);
    directionRef.current = direction;
    const autoHideRef = useRef(autoHide);
    autoHideRef.current = autoHide;
    const autoHideDelayRef = useRef(autoHideDelay);
    autoHideDelayRef.current = autoHideDelay;
    const thumbMinSizeRef = useRef(thumbMinSize);
    thumbMinSizeRef.current = thumbMinSize;

    const config: ScrollbarConfig = {
      direction,
      autoHide,
      autoHideDelay,
      thumbMinSize,
    };

    // Ref to break circular dep: applyScroll ↔ sb
    const sbRef = useRef<{
      syncThumbs: () => void;
      flash: () => void;
    } | null>(null);

    const computeRange = useCallback((offset: number, vpSize: number) => {
      const v = virtRef.current;
      if (!v.virtualizing || v.itemHeight <= 0) return { start: 0, end: 0 };
      const first = Math.floor(offset / v.itemHeight);
      const visible = Math.ceil(vpSize / v.itemHeight);
      const start = Math.max(0, first - v.overscan);
      const end = Math.min(v.itemCount - 1, first + visible + v.overscan);
      return { start, end };
    }, []);

    const updateRange = useCallback(() => {
      const v = virtRef.current;
      if (!v.virtualizing) return;
      const d = dimsRef.current;
      const offset =
        v.axis === "vertical" ? scrollYRef.current : scrollXRef.current;
      const vpSize = v.axis === "vertical" ? d.vh : d.vw;
      const nr = computeRange(offset, vpSize);
      setRange((prev) => {
        if (prev.start === nr.start && prev.end === nr.end) return prev;
        onRangeRef.current?.(nr.start, nr.end);
        return nr;
      });
    }, [computeRange]);

    const applyScroll = useCallback(
      (x: number, y: number) => {
        const d = dimsRef.current;
        const mx = Math.max(0, d.cw - d.vw);
        const my = Math.max(0, d.ch - d.vh);
        scrollXRef.current = Math.max(0, Math.min(x, mx));
        scrollYRef.current = Math.max(0, Math.min(y, my));
        // Sync target so an ongoing wheel animation doesn't fight thumb drag
        targetXRef.current = scrollXRef.current;
        targetYRef.current = scrollYRef.current;
        if (contentRef.current) {
          contentRef.current.style.transform = `translate3d(${-scrollXRef.current}px,${-scrollYRef.current}px,0)`;
        }
        // Skip scrollbar updates entirely when hideScrollbar — avoids setState on every scroll
        if (!hideScrollbarRef.current) {
          sbRef.current?.syncThumbs();
          sbRef.current?.flash();
        }
        onScrollRef.current?.(scrollXRef.current, scrollYRef.current);
        updateRange();
      },
      [updateRange],
    );

    // Smooth lerp scroll — only used for wheel events
    const wheelScrollTo = useCallback(
      (x: number, y: number) => {
        const d = dimsRef.current;
        const mx = Math.max(0, d.cw - d.vw);
        const my = Math.max(0, d.ch - d.vh);
        targetXRef.current = Math.max(0, Math.min(x, mx));
        targetYRef.current = Math.max(0, Math.min(y, my));

        if (rafRef.current !== null) return; // RAF already running

        const tick = () => {
          const tx = targetXRef.current;
          const ty = targetYRef.current;
          const cx = scrollXRef.current;
          const cy = scrollYRef.current;
          const dx = tx - cx;
          const dy = ty - cy;

          if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
            scrollXRef.current = tx;
            scrollYRef.current = ty;
            if (contentRef.current) {
              contentRef.current.style.transform = `translate3d(${-tx}px,${-ty}px,0)`;
            }
            if (!hideScrollbarRef.current) sbRef.current?.syncThumbs();
            onScrollRef.current?.(tx, ty);
            updateRange();
            rafRef.current = null;
            return;
          }

          const LERP = 0.14;
          const nx = cx + dx * LERP;
          const ny = cy + dy * LERP;
          scrollXRef.current = nx;
          scrollYRef.current = ny;
          if (contentRef.current) {
            contentRef.current.style.transform = `translate3d(${-nx}px,${-ny}px,0)`;
          }
          if (!hideScrollbarRef.current) sbRef.current?.syncThumbs();
          onScrollRef.current?.(nx, ny);
          updateRange();
          rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
      },
      [updateRange],
    );

    const sb = useScrollbar(
      config,
      scrollXRef,
      scrollYRef,
      dimsRef,
      applyScroll,
    );
    sbRef.current = sb;

    // ─── Imperative API ───

    useImperativeHandle(ref, () => ({
      scrollTo: (x, y) => applyScroll(x, y),
      scrollBy: (dx, dy) =>
        applyScroll(scrollXRef.current + dx, scrollYRef.current + dy),
      scrollToTop: () => applyScroll(scrollXRef.current, 0),
      scrollToBottom: () =>
        applyScroll(
          scrollXRef.current,
          dimsRef.current.ch - dimsRef.current.vh,
        ),
      scrollToIndex: (index) => {
        const v = virtRef.current;
        if (!v.virtualizing) return;
        const offset = index * v.itemHeight;
        if (v.axis === "vertical") applyScroll(scrollXRef.current, offset);
        else applyScroll(offset, scrollYRef.current);
      },
      getScrollPosition: () => ({
        x: scrollXRef.current,
        y: scrollYRef.current,
      }),
      getViewportRect: () =>
        viewportRef.current?.getBoundingClientRect() ?? null,
    }));

    // ─── Wheel ───

    useEffect(() => {
      const el = viewportRef.current;
      if (!el) return;

      const onWheel = (e: WheelEvent) => {
        const d = dimsRef.current;
        const canX = direction !== "vertical" && d.cw > d.vw;
        const canY = direction !== "horizontal" && d.ch > d.vh;
        if (!canX && !canY) return;

        let dx = e.deltaX;
        let dy = e.deltaY;
        // horizontal-only: treat vertical wheel as horizontal scroll
        if (canX && !canY) {
          dx = e.deltaX + e.deltaY;
          dy = 0;
        } else if (e.shiftKey && canX) {
          dx = e.deltaX + e.deltaY;
          dy = 0;
        }
        if ((canY && dy !== 0) || (canX && dx !== 0)) {
          e.preventDefault();
          e.stopPropagation();
          wheelScrollTo(
            targetXRef.current + (canX ? dx : 0),
            targetYRef.current + (canY ? dy : 0),
          );
        }
      };

      el.addEventListener("wheel", onWheel, { passive: false });
      return () => el.removeEventListener("wheel", onWheel);
    }, [direction, wheelScrollTo]);

    // ─── Touch ───

    useEffect(() => {
      const el = viewportRef.current;
      if (!el) return;

      let lastX = 0;
      let lastY = 0;
      let tracking = false;

      const onStart = (e: TouchEvent) => {
        const t = e.touches[0];
        lastX = t.clientX;
        lastY = t.clientY;
        tracking = true;
      };
      const onMove = (e: TouchEvent) => {
        if (!tracking) return;
        const t = e.touches[0];
        const dx = lastX - t.clientX;
        const dy = lastY - t.clientY;
        lastX = t.clientX;
        lastY = t.clientY;

        const d = dimsRef.current;
        const canX = direction !== "vertical" && d.cw > d.vw;
        const canY = direction !== "horizontal" && d.ch > d.vh;
        if ((canY && dy !== 0) || (canX && dx !== 0)) {
          e.preventDefault();
          applyScroll(
            scrollXRef.current + (canX ? dx : 0),
            scrollYRef.current + (canY ? dy : 0),
          );
        }
      };
      const onEnd = () => {
        tracking = false;
      };

      el.addEventListener("touchstart", onStart, { passive: true });
      el.addEventListener("touchmove", onMove, { passive: false });
      el.addEventListener("touchend", onEnd);
      return () => {
        el.removeEventListener("touchstart", onStart);
        el.removeEventListener("touchmove", onMove);
        el.removeEventListener("touchend", onEnd);
      };
    }, [direction, applyScroll]);

    // ─── Resize observer ───

    useEffect(() => {
      const vp = viewportRef.current;
      const ct = contentRef.current;
      if (!vp || !ct) return;

      const measure = () => {
        const v = virtRef.current;
        const vw = vp.clientWidth;
        const vh = vp.clientHeight;
        const cw =
          v.virtualizing && v.axis === "horizontal"
            ? totalSize
            : ct.scrollWidth;
        const ch =
          v.virtualizing && v.axis === "vertical" ? totalSize : ct.scrollHeight;
        dimsRef.current = { vw, vh, cw, ch };
        // clamp scroll
        applyScroll(scrollXRef.current, scrollYRef.current);
        // equality guard — avoid re-render when overflow state hasn't changed
        const nx = direction !== "vertical" && cw > vw;
        const ny = direction !== "horizontal" && ch > vh;
        setOverflow((prev) =>
          prev.x === nx && prev.y === ny ? prev : { x: nx, y: ny },
        );
      };

      const ro = new ResizeObserver(measure);
      ro.observe(vp);
      if (!virtualizing) ro.observe(ct);
      measure();
      return () => ro.disconnect();
    }, [direction, applyScroll, totalSize, virtualizing]);

    // ─── Cleanup RAF on unmount ───

    useEffect(() => {
      return () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    }, []);

    // ─── Render ───

    const viewportId = useId();

    const virtualItems = useMemo(() => {
      if (!virtualizing || !itemHeight) return null;
      const els: ReactNode[] = [];
      for (let i = range.start; i <= range.end; i++) {
        els.push(
          <div
            key={i}
            style={
              virtualAxis === "vertical"
                ? {
                    position: "absolute",
                    top: i * itemHeight,
                    left: 0,
                    right: 0,
                    height: itemHeight,
                  }
                : {
                    position: "absolute",
                    left: i * itemHeight,
                    top: 0,
                    bottom: 0,
                    width: itemHeight,
                  }
            }
          >
            {renderItem?.(i)}
          </div>,
        );
      }
      return els;
    }, [
      virtualizing,
      itemHeight,
      virtualAxis,
      range.start,
      range.end,
      renderItem,
    ]);

    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: mouse enter/leave controls scrollbar visibility only
      <div
        ref={viewportRef}
        id={viewportId}
        className={cn("relative overflow-hidden", className)}
        onMouseEnter={sb.onContainerEnter}
        onMouseLeave={sb.onContainerLeave}
        {...rest}
      >
        <div
          ref={contentRef}
          className={cn(
            "will-change-transform",
            !virtualizing && direction !== "vertical" && "w-max",
            innerClassName,
          )}
          style={
            virtualizing
              ? {
                  position: "relative",
                  ...(virtualAxis === "vertical"
                    ? { height: totalSize, width: "100%" }
                    : { width: totalSize, height: "100%" }),
                }
              : undefined
          }
        >
          {virtualizing ? virtualItems : children}
        </div>

        {!hideScrollbar && (
          <ScrollbarTracks
            viewportId={viewportId}
            showY={overflow.y}
            showX={overflow.x}
            visible={sb.visible}
            trackYRef={sb.trackYRef}
            trackXRef={sb.trackXRef}
            thumbYRef={sb.thumbYRef}
            thumbXRef={sb.thumbXRef}
            onThumbYDown={sb.onThumbYDown}
            onThumbXDown={sb.onThumbXDown}
            onTrackYClick={sb.onTrackYClick}
            onTrackXClick={sb.onTrackXClick}
          />
        )}
      </div>
    );
  },
);
