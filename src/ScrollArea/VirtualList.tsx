import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import { ScrollArea, type ScrollAreaRef } from "./ScrollArea";

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
  /** Fires when the visible item range changes (includes overscan) */
  onRangeChange?: (start: number, end: number) => void;
}

export interface VirtualListRef {
  scrollTo: (offset: number) => void;
  scrollBy: (delta: number) => void;
  scrollToIndex: (index: number) => void;
  getScrollOffset: () => number;
}

// ─── Component ───

/**
 * Thin wrapper around ScrollArea in virtualized mode.
 *
 * New code can use ScrollArea directly with `itemCount` / `itemHeight` /
 * `renderItem` props; this wrapper exists for the older single-axis,
 * offset-based API.
 */
export const VirtualList = forwardRef<VirtualListRef, VirtualListProps>(
  function VirtualList(
    {
      itemCount,
      itemHeight,
      renderItem,
      direction = "vertical",
      overscan = 5,
      autoHide,
      autoHideDelay,
      thumbMinSize,
      onScrollChange,
      onRangeChange,
      ...rest
    },
    ref,
  ) {
    const innerRef = useRef<ScrollAreaRef>(null);
    const vertical = direction === "vertical";

    useImperativeHandle(ref, () => ({
      scrollTo: (offset) =>
        innerRef.current?.scrollTo(
          vertical ? 0 : offset,
          vertical ? offset : 0,
        ),
      scrollBy: (delta) =>
        innerRef.current?.scrollBy(vertical ? 0 : delta, vertical ? delta : 0),
      scrollToIndex: (index) => innerRef.current?.scrollToIndex(index),
      getScrollOffset: () => {
        const p = innerRef.current?.getScrollPosition();
        if (!p) return 0;
        return vertical ? p.y : p.x;
      },
    }));

    const handleScrollChange = useCallback(
      (x: number, y: number) => onScrollChange?.(vertical ? y : x),
      [vertical, onScrollChange],
    );

    return (
      <ScrollArea
        ref={innerRef}
        direction={direction}
        itemCount={itemCount}
        itemHeight={itemHeight}
        renderItem={renderItem}
        overscan={overscan}
        autoHide={autoHide}
        autoHideDelay={autoHideDelay}
        thumbMinSize={thumbMinSize}
        onScrollChange={onScrollChange ? handleScrollChange : undefined}
        onRangeChange={onRangeChange}
        {...rest}
      />
    );
  },
);
