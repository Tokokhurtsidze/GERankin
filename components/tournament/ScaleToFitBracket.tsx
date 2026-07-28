"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The non-interactive bracket tree renders at a fixed pixel size (its
 * geometry comes from BracketTree's own constants, not the container).
 * This scales that fixed-size render up (or down) with a CSS transform so it
 * fills whatever box it's given, instead of sitting small in the middle of
 * a big homepage section. `transform` doesn't affect layout size, so
 * `scrollWidth`/`scrollHeight` below stay the tree's true, un-scaled size.
 */
export function ScaleToFitBracket({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    function recompute() {
      const cw = container!.clientWidth;
      const ch = container!.clientHeight;
      const nw = content!.scrollWidth;
      const nh = content!.scrollHeight;
      if (!cw || !ch || !nw || !nh) return;
      setScale(Math.min(cw / nw, ch / nh, 2.5));
    }

    const observer = new ResizeObserver(recompute);
    observer.observe(container);
    recompute();
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center overflow-hidden">
      <div ref={contentRef} style={{ transform: `scale(${scale})`, transformOrigin: "center" }}>
        {children}
      </div>
    </div>
  );
}
