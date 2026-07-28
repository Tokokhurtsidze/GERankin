"use client";

import { useEffect, useState } from "react";

export function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  if (days > 0) return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Starts null so the first client render matches the server-rendered
 * placeholder exactly — computing targetMs - Date.now() during initial render
 * would differ between the server's render time and the client's hydration
 * time, causing a hydration mismatch.
 */
export function useCountdownMs(targetMs: number | null): number | null {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (targetMs === null) {
      const timeout = setTimeout(() => setRemainingMs(null), 0);
      return () => clearTimeout(timeout);
    }
    const tick = () => setRemainingMs(targetMs - Date.now());
    const id = setInterval(tick, 1000);
    // Deferred (not called synchronously in the effect body) so it doesn't trigger
    // a cascading render, but still fires on the next tick instead of waiting 1s.
    const timeout = setTimeout(tick, 0);
    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, [targetMs]);

  return remainingMs;
}
