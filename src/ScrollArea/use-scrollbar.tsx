import {
  memo,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../utils";

const noop = () => {};

// ─── Config ───

export interface ScrollbarConfig {
  direction: "vertical" | "horizontal" | "both";
  thumbMinSize: number;
  autoHide: boolean;
  autoHideDelay: number;
}

export const SCROLLBAR_DEFAULTS: ScrollbarConfig = {
  direction: "both",
  thumbMinSize: 24,
  autoHide: true,
  autoHideDelay: 800,
};

// ─── Hook ───

interface DragState {
  axis: "x" | "y";
  startPointer: number;
  startScroll: number;
}

/**
 * Scrollbar state & interaction: thumb positioning, drag, auto-hide.
 * Scroll position / dimensions are owned by the caller via refs.
 */
export function useScrollbar(
  config: ScrollbarConfig,
  scrollXRef: RefObject<number>,
  scrollYRef: RefObject<number>,
  dimsRef: RefObject<{ vw: number; vh: number; cw: number; ch: number }>,
  applyScroll: (x: number, y: number) => void,
) {
  const trackYRef = useRef<HTMLDivElement>(null);
  const trackXRef = useRef<HTMLDivElement>(null);
  const thumbYRef = useRef<HTMLDivElement>(null);
  const thumbXRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hoveringRef = useRef(false);
  const [visible, setVisible] = useState(false);

  // Keep config values in refs so callbacks never need to recreate on prop changes
  const thumbMinSizeRef = useRef(config.thumbMinSize);
  thumbMinSizeRef.current = config.thumbMinSize;
  const autoHideRef = useRef(config.autoHide);
  autoHideRef.current = config.autoHide;
  const autoHideDelayRef = useRef(config.autoHideDelay);
  autoHideDelayRef.current = config.autoHideDelay;

  // Inline helpers — read from refs, safe to call anytime
  const getMaxSX = useCallback(
    () => Math.max(0, dimsRef.current.cw - dimsRef.current.vw),
    [dimsRef],
  );
  const getMaxSY = useCallback(
    () => Math.max(0, dimsRef.current.ch - dimsRef.current.vh),
    [dimsRef],
  );

  // Sync thumb DOM with current scroll position — no React state involved
  const syncThumbs = useCallback(() => {
    const { vw, vh, cw, ch } = dimsRef.current;
    const sx = scrollXRef.current;
    const sy = scrollYRef.current;
    const minSize = thumbMinSizeRef.current;

    if (thumbYRef.current && trackYRef.current) {
      if (ch <= vh) {
        trackYRef.current.style.display = "none";
      } else {
        trackYRef.current.style.display = "";
        const tH = trackYRef.current.clientHeight;
        const thumbH = Math.max(minSize, Math.round(tH * (vh / ch)));
        const maxTY = tH - thumbH;
        const msy = Math.max(0, ch - vh);
        const r = msy > 0 ? sy / msy : 0;
        thumbYRef.current.style.height = `${thumbH}px`;
        thumbYRef.current.style.transform = `translate3d(0,${Math.round(r * maxTY)}px,0)`;
      }
    }
    if (thumbXRef.current && trackXRef.current) {
      if (cw <= vw) {
        trackXRef.current.style.display = "none";
      } else {
        trackXRef.current.style.display = "";
        const tW = trackXRef.current.clientWidth;
        const thumbW = Math.max(minSize, Math.round(tW * (vw / cw)));
        const maxTX = tW - thumbW;
        const msx = Math.max(0, cw - vw);
        const r = msx > 0 ? sx / msx : 0;
        thumbXRef.current.style.width = `${thumbW}px`;
        thumbXRef.current.style.transform = `translate3d(${Math.round(r * maxTX)}px,0,0)`;
      }
    }
  }, [dimsRef, scrollXRef, scrollYRef]); // thumbMinSizeRef is stable, read via ref

  // ─── Visibility ───

  const scheduleHide = useCallback(() => {
    if (autoHideRef.current && !dragRef.current && !hoveringRef.current) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(
        () => setVisible(false),
        autoHideDelayRef.current,
      );
    }
  }, []); // reads config via refs — never recreates

  const flash = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible((v) => (v ? v : true)); // bail out if already true
    scheduleHide();
  }, [scheduleHide]);

  const onContainerEnter = useCallback(() => {
    hoveringRef.current = true;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(true);
  }, []);

  const onContainerLeave = useCallback(() => {
    hoveringRef.current = false;
    scheduleHide();
  }, [scheduleHide]);

  // ─── Thumb drag ───

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      e.preventDefault();
      const { vw, vh, cw, ch } = dimsRef.current;

      if (drag.axis === "y" && trackYRef.current) {
        const tH = trackYRef.current.clientHeight;
        const thumbH = Math.max(thumbMinSizeRef.current, tH * (vh / ch));
        const maxTY = tH - thumbH;
        if (maxTY <= 0) return;
        const msy = getMaxSY();
        const delta = e.clientY - drag.startPointer;
        const newY = Math.max(
          0,
          Math.min(drag.startScroll + (delta / maxTY) * msy, msy),
        );
        applyScroll(scrollXRef.current, newY);
      } else if (drag.axis === "x" && trackXRef.current) {
        const tW = trackXRef.current.clientWidth;
        const thumbW = Math.max(thumbMinSizeRef.current, tW * (vw / cw));
        const maxTX = tW - thumbW;
        if (maxTX <= 0) return;
        const msx = getMaxSX();
        const delta = e.clientX - drag.startPointer;
        const newX = Math.max(
          0,
          Math.min(drag.startScroll + (delta / maxTX) * msx, msx),
        );
        applyScroll(newX, scrollYRef.current);
      }
    };

    const onUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      scheduleHide();
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [
    applyScroll,
    dimsRef,
    getMaxSX,
    getMaxSY,
    scheduleHide,
    scrollXRef,
    scrollYRef,
  ]); // thumbMinSizeRef is stable, read via ref

  const onThumbYDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = {
        axis: "y",
        startPointer: e.clientY,
        startScroll: scrollYRef.current,
      };
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    },
    [scrollYRef],
  );

  const onThumbXDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = {
        axis: "x",
        startPointer: e.clientX,
        startScroll: scrollXRef.current,
      };
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    },
    [scrollXRef],
  );

  // Track click → page-jump to click position
  const onTrackYClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== e.currentTarget) return;
      const rect = trackYRef.current?.getBoundingClientRect();
      if (!rect) return;
      const { vh, ch } = dimsRef.current;
      const ratio = (e.clientY - rect.top) / rect.height;
      const msy = getMaxSY();
      applyScroll(
        scrollXRef.current,
        Math.max(0, Math.min(ratio * ch - vh / 2, msy)),
      );
    },
    [applyScroll, dimsRef, getMaxSY, scrollXRef],
  );

  const onTrackXClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== e.currentTarget) return;
      const rect = trackXRef.current?.getBoundingClientRect();
      if (!rect) return;
      const { vw, cw } = dimsRef.current;
      const ratio = (e.clientX - rect.left) / rect.width;
      const msx = getMaxSX();
      applyScroll(
        Math.max(0, Math.min(ratio * cw - vw / 2, msx)),
        scrollYRef.current,
      );
    },
    [applyScroll, dimsRef, getMaxSX, scrollYRef],
  );

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  return {
    trackYRef,
    trackXRef,
    thumbYRef,
    thumbXRef,
    visible,
    syncThumbs,
    flash,
    onContainerEnter,
    onContainerLeave,
    onThumbYDown,
    onThumbXDown,
    onTrackYClick,
    onTrackXClick,
  };
}

// ─── Scrollbar Track/Thumb Renderer ───

export interface ScrollbarTracksProps {
  viewportId: string;
  showY: boolean;
  showX: boolean;
  visible: boolean;
  trackYRef: RefObject<HTMLDivElement | null>;
  trackXRef: RefObject<HTMLDivElement | null>;
  thumbYRef: RefObject<HTMLDivElement | null>;
  thumbXRef: RefObject<HTMLDivElement | null>;
  onThumbYDown: (e: React.MouseEvent) => void;
  onThumbXDown: (e: React.MouseEvent) => void;
  onTrackYClick: (e: React.MouseEvent) => void;
  onTrackXClick: (e: React.MouseEvent) => void;
}

const THUMB_CLS =
  "rounded-full bg-black/40 dark:bg-white/30 hover:bg-black/55 dark:hover:bg-white/45 cursor-pointer active:bg-black/60 dark:active:bg-white/50 transition-colors";

export const ScrollbarTracks = memo(function ScrollbarTracks(
  p: ScrollbarTracksProps,
) {
  return (
    <>
      {p.showY && (
        <div
          ref={p.trackYRef}
          role="scrollbar"
          aria-controls={p.viewportId}
          aria-orientation="vertical"
          aria-valuenow={0}
          tabIndex={-1}
          className={cn(
            "absolute right-0.5 top-0.5 w-1.5 rounded-full transition-opacity duration-150 z-10",
            p.visible ? "opacity-100" : "opacity-0 pointer-events-none",
            p.showX ? "bottom-2.5" : "bottom-0.5",
          )}
          onClick={p.onTrackYClick}
          onKeyDown={noop}
        >
          {/* biome-ignore lint/a11y/noStaticElementInteractions: scrollbar thumb drag handle */}
          <div
            ref={p.thumbYRef}
            className={cn("w-full", THUMB_CLS)}
            onMouseDown={p.onThumbYDown}
          />
        </div>
      )}
      {p.showX && (
        <div
          ref={p.trackXRef}
          role="scrollbar"
          aria-controls={p.viewportId}
          aria-orientation="horizontal"
          aria-valuenow={0}
          tabIndex={-1}
          className={cn(
            "absolute bottom-0.5 left-0.5 h-1.5 rounded-full transition-opacity duration-150 z-10",
            p.visible ? "opacity-100" : "opacity-0 pointer-events-none",
            p.showY ? "right-2.5" : "right-0.5",
          )}
          onClick={p.onTrackXClick}
          onKeyDown={noop}
        >
          {/* biome-ignore lint/a11y/noStaticElementInteractions: scrollbar thumb drag handle */}
          <div
            ref={p.thumbXRef}
            className={cn("h-full", THUMB_CLS)}
            onMouseDown={p.onThumbXDown}
          />
        </div>
      )}
    </>
  );
});
