"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Burger trigger + slide-down panel for the header nav, mobile only. */
export function MobileNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Nav links to same-page sections (#bracket, #faq, …) default to an instant
  // anchor jump, which reads as clunky right on top of the panel's own close
  // animation. Capture-phase so this runs before the Link's own click
  // handler, close the panel, then smooth-scroll once its transition
  // (duration-300 below) has finished instead of both fighting at once.
  function onNavClickCapture(e: React.MouseEvent) {
    const anchor = (e.target as HTMLElement).closest("a");
    const href = anchor?.getAttribute("href") ?? "";
    const hashIndex = href.indexOf("#");
    if (hashIndex === -1) return;

    const target = document.getElementById(href.slice(hashIndex + 1));
    if (!target) return; // section isn't on this page — let Link navigate normally

    e.preventDefault();
    setOpen(false);
    window.setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
  }

  return (
    <div className="xl:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="ink-border flex h-9 w-9 items-center justify-center rounded-full bg-surface"
      >
        <div className="flex h-3 w-4 flex-col justify-between">
          <span
            className={`h-[1.5px] w-full origin-center bg-text transition-transform duration-300 ${
              open ? "translate-y-[5.5px] rotate-45" : ""
            }`}
          />
          <span
            className={`h-[1.5px] w-full bg-text transition-opacity duration-200 ${open ? "opacity-0" : "opacity-100"}`}
          />
          <span
            className={`h-[1.5px] w-full origin-center bg-text transition-transform duration-300 ${
              open ? "-translate-y-[5.5px] -rotate-45" : ""
            }`}
          />
        </div>
      </button>

      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-x-0 bottom-0 top-16 z-30 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        onClick={() => setOpen(false)}
        onClickCapture={onNavClickCapture}
        className={`ink-border hard-shadow fixed inset-x-0 top-16 z-40 origin-top rounded-b-2xl bg-bg transition-all duration-300 ease-out ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-base font-medium">{children}</nav>
      </div>
    </div>
  );
}
