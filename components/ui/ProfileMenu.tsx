"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";

export function ProfileMenu({
  locale,
  initial,
  dashboardLabel,
  otherLocaleHref,
  otherLocaleLabel,
  lightModeLabel,
  darkModeLabel,
  signOutLabel,
  signOutAction,
}: {
  locale: string;
  initial: string;
  dashboardLabel: string;
  otherLocaleHref: string;
  otherLocaleLabel: string;
  lightModeLabel: string;
  darkModeLabel: string;
  signOutLabel: string;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe mount flag, same pattern as ThemeToggle
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Profile menu"
        aria-expanded={open}
        className="ink-border flex h-8 w-8 items-center justify-center rounded-full bg-surface text-sm font-semibold transition-transform hover:scale-105"
      >
        {initial}
      </button>

      {open && (
        <div className="ink-border hard-shadow-sm absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-lg bg-surface py-1">
          <Link
            href={`/${locale}/dashboard`}
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-text hover:bg-bg"
          >
            {dashboardLabel}
          </Link>
          <Link
            href={otherLocaleHref}
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-text-muted hover:bg-bg hover:text-text"
          >
            {otherLocaleLabel}
          </Link>
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="block w-full px-3 py-2 text-left text-sm text-text-muted hover:bg-bg hover:text-text"
            >
              {isDark ? lightModeLabel : darkModeLabel}
            </button>
          )}
          <form action={signOutAction}>
            <button
              type="submit"
              className="block w-full px-3 py-2 text-left text-sm text-text-muted hover:bg-bg hover:text-text"
            >
              {signOutLabel}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
