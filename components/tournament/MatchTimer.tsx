"use client";

import { useCountdownMs, formatRemaining } from "@/lib/hooks/useCountdown";

/**
 * Compact per-match countdown badge. Renders nothing for any status other
 * than "live"/"overtime", and nothing if the relevant timestamp is null —
 * pending matches carry a `new Date(0)` epoch placeholder upstream (see
 * lib/bracket/serialize.ts), which is deliberately converted to null before
 * reaching this component so it can never render a garbage countdown.
 */
export function MatchTimer({
  status,
  endsAt,
  overtimeEndsAt,
}: {
  status: string;
  endsAt: string | null;
  overtimeEndsAt: string | null;
}) {
  const isOvertime = status === "overtime";
  const target = isOvertime ? overtimeEndsAt : status === "live" ? endsAt : null;
  const targetMs = target ? new Date(target).getTime() : null;
  const remainingMs = useCountdownMs(targetMs);

  if (status !== "live" && status !== "overtime") return null;
  if (targetMs === null) return null;

  return (
    <span className="font-mono-score ink-border whitespace-nowrap rounded-full bg-surface px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-text-muted">
      {isOvertime ? "OT " : ""}
      {remainingMs === null ? "--:--" : formatRemaining(Math.max(0, remainingMs))}
    </span>
  );
}
