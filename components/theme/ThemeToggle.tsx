"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard hydration-safe mount flag
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-9 w-9" />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="ink-border relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-text transition-colors hover:bg-surface"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`absolute h-[18px] w-[18px] transition-all duration-300 ease-out ${
          isDark ? "-rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
      >
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 3v2M12 19v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M3 12h2M19 12h2M4.6 19.4l1.4-1.4M18 6l1.4-1.4" />
      </svg>

      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`absolute h-[17px] w-[17px] transition-all duration-300 ease-out ${
          isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-50 opacity-0"
        }`}
      >
        <path d="M20.2 15.2A8.4 8.4 0 0 1 8.8 3.8a8.6 8.6 0 1 0 11.4 11.4Z" />
      </svg>
    </button>
  );
}
