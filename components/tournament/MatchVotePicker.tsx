"use client";

import { useState } from "react";
import { TurnstileWidget } from "./TurnstileWidget";

export function MatchVotePicker({
  matchId,
  nameA,
  nameB,
  onVoted,
}: {
  matchId: string;
  nameA: string;
  nameB: string;
  onVoted: (side: "A" | "B") => void;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voted, setVoted] = useState<"A" | "B" | null>(null);

  async function castVote(side: "A" | "B") {
    if (!token) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, side, turnstileToken: token }),
      });
      setPending(false);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Vote failed");
        return;
      }
      setVoted(side);
      onVoted(side);
    } catch {
      setPending(false);
      setError("Network error — please try again");
    }
  }

  if (voted) {
    return <p className="text-sm font-semibold text-accent">Vote cast for {voted === "A" ? nameA : nameB}</p>;
  }

  return (
    <div className="ink-border flex flex-col gap-3 rounded-lg bg-surface p-4">
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <TurnstileWidget onVerify={setToken} />
      <div className="flex gap-2">
        <button
          disabled={!token || pending}
          onClick={() => castVote("A")}
          className="flex-1 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {nameA}
        </button>
        <button
          disabled={!token || pending}
          onClick={() => castVote("B")}
          className="ink-border flex-1 rounded-md bg-bg px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
        >
          {nameB}
        </button>
      </div>
    </div>
  );
}
