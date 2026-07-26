"use client";

import { useState } from "react";
import { TurnstileWidget } from "./TurnstileWidget";

export function VoteButtons({
  matchId,
  nameA,
  nameB,
  canVote,
}: {
  matchId: string;
  nameA: string;
  nameB: string;
  canVote: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voted, setVoted] = useState<"A" | "B" | null>(null);

  async function castVote(side: "A" | "B") {
    if (!token) return;
    setPending(true);
    setError(null);
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
    setExpanded(false);
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      await navigator.share({ title: "Startup Clash GE", url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
  }

  if (voted) {
    return <p className="text-xs font-semibold text-accent">Vote cast for {voted === "A" ? nameA : nameB}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      {!expanded ? (
        <div className="flex gap-2">
          <button
            disabled={!canVote}
            onClick={() => setExpanded(true)}
            className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Vote
          </button>
          <button onClick={handleShare} className="ink-border rounded-md bg-surface px-4 py-2 text-sm font-semibold">
            Share
          </button>
        </div>
      ) : (
        <div className="ink-border flex flex-col gap-3 rounded-lg bg-surface p-4">
          <TurnstileWidget onVerify={setToken} />
          <div className="flex gap-2">
            <button
              disabled={!token || pending}
              onClick={() => castVote("A")}
              className="flex-1 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              {nameA}
            </button>
            <button
              disabled={!token || pending}
              onClick={() => castVote("B")}
              className="ink-border flex-1 rounded-md bg-bg px-3 py-2 text-xs font-semibold disabled:opacity-40"
            >
              {nameB}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
