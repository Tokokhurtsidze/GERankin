"use client";

import { useCountdownMs, formatRemaining } from "@/lib/hooks/useCountdown";

/** Live countdown, ticking client-side. */
export function RegistrationCountdown({
  closesAt,
  closingLabel = "closing...",
}: {
  closesAt: string;
  closingLabel?: string;
}) {
  const target = new Date(closesAt).getTime();
  const remainingMs = useCountdownMs(target);

  if (remainingMs === null) {
    return (
      <span className="font-mono-score ink-border rounded-full bg-surface px-3 py-1 text-sm font-semibold tabular-nums">
        --:--
      </span>
    );
  }

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
