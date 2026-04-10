import {
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { cn } from "./utils";

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

export interface HorizontalScrollProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode;
  /** Extra class applied to the inner flex container */
  innerClassName?: string;
}

/**
 * 无滚动条横向滚动容器（纯 JS 实现，不依赖浏览器 overflow 滚动）。
 * - 鼠标滚轮（含触控板横向手势）在容器内生效，垂直滚动自动转换为横向
 * - 平滑缓动动画（RAF + 弹性系数 0.15）
 * - overflow: hidden，完全不显示任何滚动条
 */
export function HorizontalScroll({
  children,
  className,
  innerClassName,
  ...props
}: HorizontalScrollProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const scrollXRef = useRef(0);
  const targetRef = useRef(0);
  const rafRef = useRef<number>(0);

  const maxScroll = useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return 0;
    return Math.max(0, inner.scrollWidth - outer.clientWidth);
  }, []);

  const applyTransform = useCallback((x: number) => {
    if (!innerRef.current) return;
    innerRef.current.style.transform = `translateX(${-x}px)`;
    scrollXRef.current = x;
  }, []);

  const tick = useCallback(() => {
    const cur = scrollXRef.current;
    const tgt = targetRef.current;
    const diff = tgt - cur;
    if (Math.abs(diff) < 0.3) {
      applyTransform(tgt);
      return;
    }
    applyTransform(cur + diff * 0.15);
    rafRef.current = requestAnimationFrame(tick);
  }, [applyTransform]);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    const onWheel = (e: WheelEvent) => {
      const max = maxScroll();
      if (max <= 0) return;
      e.preventDefault();
      targetRef.current = clamp(
        targetRef.current + e.deltaY + e.deltaX,
        0,
        max,
      );
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    outer.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      outer.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(rafRef.current);
    };
  }, [maxScroll, tick]);

  return (
    <div ref={outerRef} className={cn("overflow-hidden", className)} {...props}>
      <div
        ref={innerRef}
        className={cn("flex w-max", innerClassName)}
        style={{ willChange: "transform" }}
      >
        {children}
      </div>
    </div>
  );
}
