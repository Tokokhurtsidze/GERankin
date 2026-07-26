"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number) {
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

/** Live countdown, ticking client-side. */
export function RegistrationCountdown({
  closesAt,
  closingLabel = "closing...",
}: {
  closesAt: string;
  closingLabel?: string;
}) {
  const target = new Date(closesAt).getTime();
  const [remainingMs, setRemainingMs] = useState(() => target - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemainingMs(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (remainingMs <= 0) {
    return (
      <span className="font-mono-score rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
        {closingLabel}
      </span>
    );
  }

  return (
    <span className="font-mono-score ink-border rounded-full bg-surface px-3 py-1 text-sm font-semibold tabular-nums">
      {formatRemaining(remainingMs)}
    </span>
  );
}
