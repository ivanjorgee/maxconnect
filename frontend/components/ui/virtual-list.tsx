"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type VirtualListProps<T> = {
  items: T[];
  height: number | string;
  itemHeight: number;
  overscan?: number;
  className?: string;
  getKey?: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
};

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  overscan = 6,
  className,
  getKey,
  renderItem,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => setViewportHeight(node.clientHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const onScroll = () => setScrollTop(node.scrollTop);
    node.addEventListener("scroll", onScroll);
    return () => node.removeEventListener("scroll", onScroll);
  }, []);

  const totalHeight = items.length * itemHeight;
  const visibleCount = viewportHeight ? Math.ceil(viewportHeight / itemHeight) + overscan * 2 : items.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const visibleItems = useMemo(() => items.slice(startIndex, endIndex), [items, startIndex, endIndex]);

  return (
    <div ref={containerRef} className={cn("relative overflow-y-auto", className)} style={{ height }}>
      <div className="relative w-full" style={{ height: totalHeight }}>
        {visibleItems.map((item, idx) => {
          const index = startIndex + idx;
          const key = getKey ? getKey(item, index) : String(index);
          return (
            <div
              key={key}
              className="absolute left-0 right-0"
              style={{ top: index * itemHeight, height: itemHeight }}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
