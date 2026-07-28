"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export interface SlideSectionMeta {
  id: string;
  label: string;
}

/**
 * Turns homepage sections into a vertical slide deck: each section snaps
 * full-height, one at a time, as the user scrolls or clicks a dot.
 * Content past this container (the closing CTA + footer) scrolls in normally
 * once the user reaches the last slide.
 */
export function SlideScroller({ sections, children }: { sections: SlideSectionMeta[]; children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = targets.indexOf(entry.target as HTMLElement);
            if (idx >= 0) setActive(idx);
          }
        }
      },
      { root: container, threshold: 0.5 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const goTo = useCallback(
    (index: number) => {
      const section = sections[index];
      if (!section) return;
      document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [sections]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      // Once the page has scrolled past the deck (into the full-tree section,
      // footer, etc.) these keys should do normal page scrolling instead.
      if (window.scrollY > 0) return;
      if (sections.length === 0) return;

      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        goTo(Math.min(activeRef.current + 1, sections.length - 1));
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goTo(Math.max(activeRef.current - 1, 0));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sections, goTo]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="no-scrollbar h-[calc(100dvh-4rem)] snap-y snap-mandatory overflow-y-auto scroll-smooth"
      >
        {children}
      </div>

      <div className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 sm:flex">
        {sections.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            aria-label={`Go to ${s.label}`}
            title={s.label}
            className={`h-2.5 w-2.5 rounded-full border border-border transition-colors ${
              i === active ? "bg-accent" : "bg-surface"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
