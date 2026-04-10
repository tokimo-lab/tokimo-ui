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

export interface VirtualListProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Total number of items */
  itemCount: number;
  /** Item size in the scroll direction (height for vertical, width for horizontal) */
  itemHeight: number;
  /** Render callback. Return value is wrapped in a positioning container. */
  renderItem: (index: number) => ReactNode;
  /** Scroll axis. @default "vertical" */
  direction?: "vertical" | "horizontal";
  /** Extra items rendered outside viewport for smooth scrolling. @default 5 */
  overscan?: number;
  /** Auto-hide scrollbar. @default true */
  autoHide?: boolean;
  /** Delay (ms) before hiding scrollbar. @default 800 */
  autoHideDelay?: number;
  /** Minimum thumb length (px). @default 24 */
  thumbMinSize?: number;
  /** Fires on every scroll offset change */
  onScrollChange?: (offset: number) => void;
}

export interface VirtualListRef {
  scrollTo: (offset: number) => void;
  scrollBy: (delta: number) => void;
  scrollToIndex: (index: number) => void;
  getScrollOffset: () => number;
}

// ─── Component ───

export const VirtualList = forwardRef<VirtualListRef, VirtualListProps>(
  function VirtualList(
    {
      itemCount,
      itemHeight,
      renderItem,
      direction = "vertical",
      overscan = 5,
      autoHide = true,
      autoHideDelay = 800,
      thumbMinSize = 24,
      onScrollChange,
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const vertical = direction === "vertical";
    const viewportRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef(0); // single-axis scroll offset
    const scrollXRef = useRef(0);
    const scrollYRef = useRef(0);
    const dimsRef = useRef({ vw: 0, vh: 0, cw: 0, ch: 0 });
    const vpSizeRef = useRef(0); // viewport size in scroll axis
    const onScrollRef = useRef(onScrollChange);
    onScrollRef.current = onScrollChange;
    const renderItemRef = useRef(renderItem);
    renderItemRef.current = renderItem;

    const totalSize = itemCount * itemHeight;

    // Visible range — only state that triggers re-render
    const [range, setRange] = useState({ start: 0, end: 0 });

    const computeRange = useCallback(
      (offset: number, vpSize: number) => {
        const first = Math.floor(offset / itemHeight);
        const visible = Math.ceil(vpSize / itemHeight);
        const start = Math.max(0, first - overscan);
        const end = Math.min(itemCount - 1, first + visible + overscan);
        return { start, end };
      },
      [itemHeight, itemCount, overscan],
    );

    const config: ScrollbarConfig = {
      direction: vertical ? "vertical" : "horizontal",
      autoHide,
      autoHideDelay,
      thumbMinSize,
    };

    // Ref to break circular dep: applyScroll ↔ sb
    const sbRef = useRef<{
      syncThumbs: () => void;
      flash: () => void;
    } | null>(null);

    const applyScroll = useCallback(
      (x: number, y: number) => {
        const d = dimsRef.current;
        const mx = Math.max(0, d.cw - d.vw);
        const my = Math.max(0, d.ch - d.vh);
        const cx = Math.max(0, Math.min(x, mx));
        const cy = Math.max(0, Math.min(y, my));
        scrollXRef.current = cx;
        scrollYRef.current = cy;
        const offset = vertical ? cy : cx;
        scrollRef.current = offset;

        sbRef.current?.syncThumbs();
        sbRef.current?.flash();
        onScrollRef.current?.(offset);

        // Update visible range (batched via setState)
        const nr = computeRange(offset, vpSizeRef.current);
        setRange((prev) =>
          prev.start === nr.start && prev.end === nr.end ? prev : nr,
        );
      },
      [vertical, computeRange],
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
      scrollTo: (offset) =>
        applyScroll(vertical ? 0 : offset, vertical ? offset : 0),
      scrollBy: (delta) =>
        applyScroll(
          vertical ? 0 : scrollRef.current + delta,
          vertical ? scrollRef.current + delta : 0,
        ),
      scrollToIndex: (index) => {
        const offset = index * itemHeight;
        applyScroll(vertical ? 0 : offset, vertical ? offset : 0);
      },
      getScrollOffset: () => scrollRef.current,
    }));

    // ─── Wheel ───

    useEffect(() => {
      const el = viewportRef.current;
      if (!el) return;

      const onWheel = (e: WheelEvent) => {
        const d = dimsRef.current;
        const canScroll = vertical ? d.ch > d.vh : d.cw > d.vw;
        if (!canScroll) return;

        // Use deltaY for vertical, deltaX (or deltaY with shift) for horizontal
        let delta: number;
        if (vertical) {
          delta = e.deltaY;
        } else {
          delta = e.shiftKey ? e.deltaY : e.deltaX || e.deltaY;
        }
        if (delta === 0) return;

        e.preventDefault();
        const next = scrollRef.current + delta;
        applyScroll(vertical ? 0 : next, vertical ? next : 0);
      };

      el.addEventListener("wheel", onWheel, { passive: false });
      return () => el.removeEventListener("wheel", onWheel);
    }, [vertical, applyScroll]);

    // ─── Touch ───

    useEffect(() => {
      const el = viewportRef.current;
      if (!el) return;
      let last = 0;
      let tracking = false;

      const onStart = (e: TouchEvent) => {
        const t = e.touches[0];
        last = vertical ? t.clientY : t.clientX;
        tracking = true;
      };
      const onMove = (e: TouchEvent) => {
        if (!tracking) return;
        const t = e.touches[0];
        const cur = vertical ? t.clientY : t.clientX;
        const delta = last - cur;
        last = cur;
        if (delta !== 0) {
          e.preventDefault();
          const next = scrollRef.current + delta;
          applyScroll(vertical ? 0 : next, vertical ? next : 0);
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
    }, [vertical, applyScroll]);

    // ─── Measure viewport ───

    useEffect(() => {
      const el = viewportRef.current;
      if (!el) return;

      const measure = () => {
        const vw = el.clientWidth;
        const vh = el.clientHeight;
        vpSizeRef.current = vertical ? vh : vw;
        dimsRef.current = {
          vw,
          vh,
          cw: vertical ? vw : totalSize,
          ch: vertical ? totalSize : vh,
        };
        // Reclamp + recompute range
        applyScroll(scrollXRef.current, scrollYRef.current);
      };

      const ro = new ResizeObserver(measure);
      ro.observe(el);
      measure();
      return () => ro.disconnect();
    }, [vertical, totalSize, applyScroll]);

    // ─── Render items ───

    const offset = scrollRef.current - range.start * itemHeight;

    const items = useMemo(() => {
      const els: ReactNode[] = [];
      for (let i = range.start; i <= range.end; i++) {
        const pos = (i - range.start) * itemHeight;
        els.push(
          vertical ? (
            <div key={i} style={{ height: itemHeight, width: "100%" }}>
              {renderItemRef.current(i)}
            </div>
          ) : (
            <div
              key={i}
              style={{
                width: itemHeight,
                height: "100%",
                position: "absolute",
                left: pos,
                top: 0,
              }}
            >
              {renderItemRef.current(i)}
            </div>
          ),
        );
      }
      return els;
    }, [range.start, range.end, itemHeight, vertical]); // renderItemRef is stable

    const showY = vertical && totalSize > (dimsRef.current.vh || 1);
    const showX = !vertical && totalSize > (dimsRef.current.vw || 1);

    const viewportId = useId();

    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: mouse enter/leave controls scrollbar visibility only
      <div
        ref={viewportRef}
        id={viewportId}
        className={cn("relative overflow-hidden", className)}
        style={style}
        onMouseEnter={sb.onContainerEnter}
        onMouseLeave={sb.onContainerLeave}
        {...rest}
      >
        {/* Items container — shifted by sub-item offset */}
        <div
          style={
            vertical
              ? {
                  willChange: "transform",
                  transform: `translate3d(0,${-offset}px,0)`,
                }
              : {
                  willChange: "transform",
                  transform: `translate3d(${-offset}px,0,0)`,
                  position: "relative",
                  height: "100%",
                  width: (range.end - range.start + 1) * itemHeight,
                }
          }
        >
          {items}
        </div>

        <ScrollbarTracks
          viewportId={viewportId}
          showY={showY}
          showX={showX}
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
      </div>
    );
  },
);
