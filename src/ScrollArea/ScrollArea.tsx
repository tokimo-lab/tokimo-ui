import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
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
  children: ReactNode;
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
}

export interface ScrollAreaRef {
  scrollTo: (x: number, y: number) => void;
  scrollBy: (dx: number, dy: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  getScrollPosition: () => { x: number; y: number };
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
      className,
      ...rest
    },
    ref,
  ) {
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

    const applyScroll = useCallback((x: number, y: number) => {
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
    }, []);

    // Smooth lerp scroll — only used for wheel events
    const wheelScrollTo = useCallback((x: number, y: number) => {
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
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    }, []);

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
      getScrollPosition: () => ({
        x: scrollXRef.current,
        y: scrollYRef.current,
      }),
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
        const d = {
          vw: vp.clientWidth,
          vh: vp.clientHeight,
          cw: ct.scrollWidth,
          ch: ct.scrollHeight,
        };
        dimsRef.current = d;
        // clamp scroll
        applyScroll(scrollXRef.current, scrollYRef.current);
        // equality guard — avoid re-render when overflow state hasn't changed
        const nx = direction !== "vertical" && d.cw > d.vw;
        const ny = direction !== "horizontal" && d.ch > d.vh;
        setOverflow((prev) =>
          prev.x === nx && prev.y === ny ? prev : { x: nx, y: ny },
        );
      };

      const ro = new ResizeObserver(measure);
      ro.observe(vp);
      ro.observe(ct);
      measure();
      return () => ro.disconnect();
    }, [direction, applyScroll]);

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
            direction !== "vertical" && "w-max",
            innerClassName,
          )}
        >
          {children}
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
