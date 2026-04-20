import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Variable-height virtualization core.
//
// Given a list of `itemCount` items with caller-provided size estimates,
// this hook tracks actual measured sizes (via ResizeObserver on each rendered
// slot) and maintains a prefix-sum offset table so ScrollArea can:
//
//  • compute the visible range given scroll offset + viewport size
//  • position each visible slot absolutely at its measured/estimated start
//  • expose item offsets for overlays (e.g. an active-row indicator)
//
// Design notes:
//  • Offsets are lazily memoized from `sizeVersion` — any measurement change
//    bumps the version which triggers a recompute. The prefix-sum is O(n);
//    for the list sizes we care about (< 10k items) this is fast enough and
//    avoids the complexity of a segment tree.
//  • Measured sizes are keyed by index, NOT by item identity. When list
//    contents reorder, ResizeObserver still fires on any actual layout
//    delta, so the cache self-corrects on the next paint.

export interface VariableVirtualOptions {
  enabled: boolean;
  itemCount: number;
  axis: "vertical" | "horizontal";
  /** Per-index estimated size used before ResizeObserver measures the real one. */
  estimateSize: (index: number) => number;
  /** Extra items rendered outside viewport for smooth scrolling. */
  overscan: number;
  /** Current scroll offset along the axis. */
  scrollOffset: number;
  /** Viewport size along the axis. */
  viewportSize: number;
}

export interface VirtualItem {
  index: number;
  start: number;
  size: number;
  /** Ref callback to attach to the slot element for size measurement. */
  measureRef: (el: HTMLElement | null) => void;
}

export interface VariableVirtualizer {
  totalSize: number;
  virtualItems: VirtualItem[];
  getItemOffset: (index: number) => number | null;
  getItemSize: (index: number) => number | null;
}

export function useVariableVirtualizer(
  opts: VariableVirtualOptions,
): VariableVirtualizer {
  const { enabled, itemCount, axis, estimateSize, overscan } = opts;

  // Measured sizes (index → real size). Missing entries fall back to estimates.
  const measuredRef = useRef<Map<number, number>>(new Map());
  // ResizeObserver registrations: element → index.
  const observedRef = useRef<Map<Element, number>>(new Map());
  // Bumped whenever any measured size changes — triggers offset recomputation.
  const [sizeVersion, setSizeVersion] = useState(0);

  const estimateRef = useRef(estimateSize);
  estimateRef.current = estimateSize;

  // Prune measurements when itemCount shrinks so we don't hold stale tail entries.
  useEffect(() => {
    const m = measuredRef.current;
    let changed = false;
    for (const key of m.keys()) {
      if (key >= itemCount) {
        m.delete(key);
        changed = true;
      }
    }
    if (changed) setSizeVersion((v) => v + 1);
  }, [itemCount]);

  const resizeObserver = useMemo(() => {
    if (typeof ResizeObserver === "undefined") return null;
    return new ResizeObserver((entries) => {
      const m = measuredRef.current;
      const obs = observedRef.current;
      let changed = false;
      for (const entry of entries) {
        const index = obs.get(entry.target);
        if (index == null) continue;
        // Use border-box so wrapper margins/paddings are included; falls back
        // to getBoundingClientRect on platforms without borderBoxSize.
        let size: number;
        const bbs = entry.borderBoxSize?.[0];
        if (bbs) {
          size = axis === "vertical" ? bbs.blockSize : bbs.inlineSize;
        } else {
          const rect = (entry.target as HTMLElement).getBoundingClientRect();
          size = axis === "vertical" ? rect.height : rect.width;
        }
        // Round to avoid sub-pixel churn.
        const rounded = Math.round(size * 100) / 100;
        const prev = m.get(index);
        if (prev !== rounded) {
          m.set(index, rounded);
          changed = true;
        }
      }
      if (changed) setSizeVersion((v) => v + 1);
    });
  }, [axis]);

  useEffect(() => {
    return () => {
      resizeObserver?.disconnect();
      observedRef.current.clear();
    };
  }, [resizeObserver]);

  // Prefix-sum offsets — recomputed when itemCount or measurements change.
  // offsets[i] = start offset of item i; offsets[itemCount] = totalSize.
  // biome-ignore lint/correctness/useExhaustiveDependencies: sizeVersion is the measurement-change trigger
  const offsets = useMemo(() => {
    if (!enabled) return null;
    const arr = new Float64Array(itemCount + 1);
    const m = measuredRef.current;
    let acc = 0;
    for (let i = 0; i < itemCount; i++) {
      arr[i] = acc;
      const size = m.get(i) ?? estimateRef.current(i);
      acc += size;
    }
    arr[itemCount] = acc;
    return arr;
  }, [enabled, itemCount, sizeVersion]);

  const totalSize = offsets ? offsets[itemCount] : 0;

  const getSize = useCallback((index: number): number => {
    const cached = measuredRef.current.get(index);
    if (cached != null) return cached;
    return estimateRef.current(index);
  }, []);

  // Binary search: first index whose start offset > targetOffset, minus 1.
  const findIndexAtOffset = useCallback(
    (targetOffset: number): number => {
      if (!offsets || itemCount === 0) return 0;
      let lo = 0;
      let hi = itemCount - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >>> 1;
        if (offsets[mid] <= targetOffset) lo = mid;
        else hi = mid - 1;
      }
      return lo;
    },
    [offsets, itemCount],
  );

  const measureRefCache = useRef<Map<number, (el: HTMLElement | null) => void>>(
    new Map(),
  );

  const measureRefFor = useCallback(
    (index: number) => {
      const cache = measureRefCache.current;
      const existing = cache.get(index);
      if (existing) return existing;
      const cb = (el: HTMLElement | null) => {
        const ro = resizeObserver;
        const obs = observedRef.current;
        if (!ro) return;
        if (el) {
          for (const [prevEl, prevIdx] of obs) {
            if (prevIdx === index && prevEl !== el) {
              ro.unobserve(prevEl);
              obs.delete(prevEl);
            }
          }
          if (!obs.has(el)) {
            obs.set(el, index);
            ro.observe(el);
          } else {
            obs.set(el, index);
          }
        }
        // Intentionally do NOT unobserve on unmount — slots unmount when they
        // scroll out of view but we keep the measurement cached. Cleanup runs
        // on hook unmount via the effect above.
      };
      cache.set(index, cb);
      return cb;
    },
    [resizeObserver],
  );

  // Invalidate ref-callback cache when itemCount changes (index semantics may shift).
  // biome-ignore lint/correctness/useExhaustiveDependencies: itemCount is the invalidation trigger
  useEffect(() => {
    measureRefCache.current.clear();
  }, [itemCount]);

  const virtualItems = useMemo<VirtualItem[]>(() => {
    if (!enabled || !offsets || itemCount === 0) return [];
    const startIdx = Math.max(
      0,
      findIndexAtOffset(opts.scrollOffset) - overscan,
    );
    const endOffset = opts.scrollOffset + opts.viewportSize;
    let endIdx = findIndexAtOffset(endOffset);
    // Walk one more to include the partially-visible trailing item.
    while (endIdx < itemCount - 1 && offsets[endIdx + 1] < endOffset) endIdx++;
    endIdx = Math.min(itemCount - 1, endIdx + overscan);

    const items: VirtualItem[] = [];
    for (let i = startIdx; i <= endIdx; i++) {
      items.push({
        index: i,
        start: offsets[i],
        size: offsets[i + 1] - offsets[i],
        measureRef: measureRefFor(i),
      });
    }
    return items;
  }, [
    enabled,
    offsets,
    itemCount,
    overscan,
    opts.scrollOffset,
    opts.viewportSize,
    findIndexAtOffset,
    measureRefFor,
  ]);

  return {
    totalSize,
    virtualItems,
    getItemOffset: useCallback(
      (index: number) => {
        if (!offsets || index < 0 || index >= itemCount) return null;
        return offsets[index];
      },
      [offsets, itemCount],
    ),
    getItemSize: useCallback(
      (index: number) => {
        if (index < 0 || index >= itemCount) return null;
        return getSize(index);
      },
      [itemCount, getSize],
    ),
  };
}
