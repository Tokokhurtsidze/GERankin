"use client";

/**
 * Up/down buttons for scrolling within one SlideScroller section (id `targetId`)
 * one "page" at a time, without depending on wheel/touch scroll gestures.
 * `sticky bottom-4` inside that section's own scrollable div, so it floats at
 * the bottom of whatever's currently visible and rides along as you scroll.
 */
export function SectionScrollNav({ targetId, step = 340 }: { targetId: string; step?: number }) {
  function scroll(direction: 1 | -1) {
    document.getElementById(targetId)?.scrollBy({ top: direction * step, behavior: "smooth" });
  }

  return (
    <div className="sticky bottom-4 z-20 mt-4 flex justify-center gap-3">
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label="Scroll up"
        className="ink-border hard-shadow-sm flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text hover:bg-bg"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label="Scroll down"
        className="ink-border hard-shadow-sm flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text hover:bg-bg"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}
