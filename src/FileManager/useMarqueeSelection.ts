/** Rubber-band (marquee) selection for file grid/list views */

import { useCallback, useEffect, useRef, useState } from "react";

export interface MarqueeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseMarqueeSelectionOptions {
  /** The scrollable container element */
  containerRef: React.RefObject<HTMLElement | null>;
  /** data-path attribute selector for item wrappers */
  itemSelector: string;
  /** Callback to set selected file paths */
  onSelect: (paths: Set<string>) => void;
  /** Whether marquee is disabled (e.g. during rename) */
  disabled?: boolean;
}

/** Compute intersection between two axis-aligned rectangles */
function rectsIntersect(a: DOMRect, b: MarqueeRect): boolean {
  return (
    a.left < b.x + b.width &&
    a.right > b.x &&
    a.top < b.y + b.height &&
    a.bottom > b.y
  );
}

export function useMarqueeSelection({
  containerRef,
  itemSelector,
  onSelect,
  disabled,
}: UseMarqueeSelectionOptions) {
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const activeRef = useRef(false);
  const addModeRef = useRef(false);
  /** True briefly after a marquee drag ends, so click handlers can skip clearing */
  const justFinishedRef = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      // Only left mouse button on empty area
      if (e.button !== 0) return;

      // Don't start marquee if clicking on an interactive item
      const target = e.target as HTMLElement;
      if (target.closest("[data-file-path]")) return;
      if (target.closest("button")) return;
      if (target.closest("input")) return;

      // Store whether Ctrl/Meta is held for additive mode
      addModeRef.current = e.ctrlKey || e.metaKey;

      startRef.current = { x: e.clientX, y: e.clientY };
    },
    [disabled],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const start = startRef.current;
      if (!start) return;

      // Require minimum drag distance (5px) to avoid accidental marquee
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!activeRef.current && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;

      activeRef.current = true;
      e.preventDefault();

      const rect: MarqueeRect = {
        x: Math.min(start.x, e.clientX),
        y: Math.min(start.y, e.clientY),
        width: Math.abs(dx),
        height: Math.abs(dy),
      };
      setMarquee(rect);

      // Find items intersecting the marquee rectangle
      const items = container.querySelectorAll(itemSelector);
      const selected = new Set<string>();
      for (const item of items) {
        const path = (item as HTMLElement).dataset.filePath;
        if (!path) continue;
        const itemRect = item.getBoundingClientRect();
        if (rectsIntersect(itemRect, rect)) {
          selected.add(path);
        }
      }
      onSelect(selected);
    };

    const handleMouseUp = () => {
      if (activeRef.current) {
        justFinishedRef.current = true;
        requestAnimationFrame(() => {
          justFinishedRef.current = false;
        });
      }
      startRef.current = null;
      activeRef.current = false;
      setMarquee(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [containerRef, itemSelector, onSelect]);

  return { marquee, handleMouseDown, justFinishedRef };
}
