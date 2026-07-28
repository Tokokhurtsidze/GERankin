"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LiveWebsitePreview } from "./LiveWebsitePreview";
import { OutboundLink } from "./OutboundLink";
import { TurnstileWidget } from "./TurnstileWidget";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

interface CompareSide {
  id: string;
  name: string;
  tagline: string;
  logoUrl: string;
  websiteUrl: string;
}

function Column({
  side,
  sideKey,
  votes,
  tournamentId,
  dict,
  token,
  pending,
  voted,
  bumped,
  onVote,
  backHref,
  backLabel,
  reverseOnMobile = false,
}: {
  side: CompareSide;
  sideKey: "A" | "B";
  votes: number;
  tournamentId: string;
  dict: Dictionary["match"];
  token: string | null;
  pending: boolean;
  voted: "A" | "B" | null;
  bumped: "A" | "B" | null;
  onVote: (side: "A" | "B") => void;
  backHref?: string;
  backLabel?: string;
  // On mobile (stacked) layout, put the preview above the title/info instead
  // of below — used for the second startup so its header isn't sandwiched
  // between the two previews.
  reverseOnMobile?: boolean;
}) {
  const headerOrder = reverseOnMobile ? "order-2 sm:order-1" : "order-1";
  const previewOrder = reverseOnMobile ? "order-1 sm:order-2" : "order-2";

  return (
    <div className="flex flex-col gap-1">
      <div
        className={`ink-border hard-shadow-sm flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 ${headerOrder}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          {backHref && (
            <Link
              href={backHref}
              aria-label={backLabel}
              className="ink-border flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg text-text hover:bg-border"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
          )}
          <Image
            src={side.logoUrl}
            alt={side.name}
            width={32}
            height={32}
            className="ink-border h-8 w-8 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0 leading-tight">
            <h2 className="truncate text-sm font-bold tracking-tight">{side.name}</h2>
            <OutboundLink
              startupId={side.id}
              tournamentId={tournamentId}
              href={side.websiteUrl}
              source="card"
              className="block truncate text-xs text-text-muted hover:text-accent hover:underline"
            >
              {side.tagline}
            </OutboundLink>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => onVote(sideKey)}
            disabled={!token || pending || voted !== null}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
              voted === sideKey
                ? "bg-accent text-white"
                : "ink-border bg-bg text-text disabled:opacity-40 enabled:hover:bg-surface"
            }`}
          >
            {voted === sideKey ? "✓" : dict.vote}
            <span
              className={`font-mono-score inline-block transition-transform duration-300 ${
                bumped === sideKey ? "scale-125 text-accent" : "scale-100"
              }`}
            >
              {votes}
            </span>
          </button>
        </div>
      </div>

      <div
        className={`ink-border hard-shadow-sm h-[60vh] min-h-[20rem] overflow-hidden rounded-xl sm:h-[calc(100dvh-7rem)] sm:min-h-[28rem] ${previewOrder}`}
      >
        <LiveWebsitePreview url={side.websiteUrl} alt={side.name} />
      </div>
    </div>
  );
}

export function MatchCompareGrid({
  matchId,
  tournamentId,
  startupA,
  startupB,
  initialVotesA,
  initialVotesB,
  initialVoted = null,
  backHref,
  dict,
}: {
  matchId: string;
  tournamentId: string;
  startupA: CompareSide;
  startupB: CompareSide;
  initialVotesA: number;
  initialVotesB: number;
  initialVoted?: "A" | "B" | null;
  backHref?: string;
  dict: Dictionary["match"];
}) {
  const [token, setToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voted, setVoted] = useState<"A" | "B" | null>(initialVoted);
  const [votesA, setVotesA] = useState(initialVotesA);
  const [votesB, setVotesB] = useState(initialVotesB);
  const [bumped, setBumped] = useState<"A" | "B" | null>(null);
  // Which side is widened to give its live preview enough room to render a
  // tablet/desktop layout instead of being squeezed into a 50/50 split.
  const [expanded, setExpanded] = useState<"A" | "B" | null>(null);

  // Matches the flex-[3]/flex-[1] split below, so the handle sits right on the
  // actual boundary between panels instead of staying pinned to 50%.
  const dividerLeftPercent = expanded === "A" ? 75 : expanded === "B" ? 25 : 50;

  function flexClass(side: "A" | "B") {
    if (expanded === null) return "sm:flex-1";
    return expanded === side ? "sm:flex-[3]" : "sm:flex-[1]";
  }

  async function castVote(side: "A" | "B") {
    if (!token || pending || voted) return;
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
        setError(json.error ?? dict.voteFailed);
        return;
      }
      setVoted(side);
      if (side === "A") setVotesA((v) => v + 1);
      else setVotesB((v) => v + 1);
      setBumped(side);
      setTimeout(() => setBumped(null), 500);
    } catch {
      setPending(false);
      setError(dict.networkError);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex flex-col gap-1 sm:flex-row sm:gap-2">
        <div className={`min-w-0 transition-[flex-grow] duration-300 ${flexClass("A")}`}>
          <Column
            side={startupA}
            sideKey="A"
            votes={votesA}
            tournamentId={tournamentId}
            dict={dict}
            token={token}
            pending={pending}
            voted={voted}
            bumped={bumped}
            onVote={castVote}
            backHref={backHref}
            backLabel={dict.backToRound}
          />
        </div>
        <div className={`min-w-0 transition-[flex-grow] duration-300 ${flexClass("B")}`}>
          <Column
            side={startupB}
            sideKey="B"
            votes={votesB}
            tournamentId={tournamentId}
            dict={dict}
            token={token}
            pending={pending}
            voted={voted}
            bumped={bumped}
            onVote={castVote}
            reverseOnMobile
          />
        </div>

        <div
          style={{ left: `${dividerLeftPercent}%` }}
          className="absolute top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-full ink-border bg-surface hard-shadow-sm transition-[left] duration-300 sm:flex"
        >
          <button
            type="button"
            onClick={() => setExpanded((prev) => (prev === "B" ? null : "B"))}
            aria-label="Widen second startup's preview"
            aria-pressed={expanded === "B"}
            className={`flex h-8 w-8 items-center justify-center transition-colors ${
              expanded === "B" ? "bg-accent text-white" : "text-text hover:bg-bg"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setExpanded((prev) => (prev === "A" ? null : "A"))}
            aria-label="Widen first startup's preview"
            aria-pressed={expanded === "A"}
            className={`flex h-8 w-8 items-center justify-center border-t border-border transition-colors ${
              expanded === "A" ? "bg-accent text-white" : "text-text hover:bg-bg"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {error && <p className="text-center text-sm font-medium text-red-600">{error}</p>}

      {voted === null && (
        <div className="mx-auto">
          <TurnstileWidget onVerify={setToken} />
        </div>
      )}
    </div>
  );
}
